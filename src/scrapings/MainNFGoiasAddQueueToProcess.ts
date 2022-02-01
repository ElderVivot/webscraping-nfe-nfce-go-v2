import puppeteer from 'puppeteer'
import 'dotenv/config'

import { logger } from '@common/log'
import { cleanDataObject } from '@utils/clean-data-object'
import * as functions from '@utils/functions'

import { ISettingsNFeGoias, TModelNotaFiscal, TSituationNotaFiscal } from './_interfaces'
import { CheckIfCompanieIsValid } from './CheckIfCompanieIsValid'
import { GetCnpjs } from './GetCnpjs'
import { LoguinCertificado } from './LoguinCertificado'
import { PeriodToDownNFeGoias } from './PeriodToDownNFeGoias'
import { SetDateInicialAndFinalOfMonth } from './SetDateInicialAndFinalOfMonth'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

const modelosNFe = (() => {
    const optionsDefault: TModelNotaFiscal[] = ['55', '65', '57']
    if (!process.env.MODELOS_NFs) return optionsDefault
    else {
        const arrayModelos: TModelNotaFiscal[] = []
        const options = process.env.MODELOS_NFs.split(',')
        for (const option of options) {
            if (option === '55' || option === '65' || option === '57') arrayModelos.push(option)
        }
        return arrayModelos
    }
})()

const situacaoNFs = (() => {
    const optionsDefault: TSituationNotaFiscal[] = ['1', '2']
    if (!process.env.SITUATION_NFs) return optionsDefault
    else {
        const arraySituations: TSituationNotaFiscal[] = []
        const options = process.env.SITUATION_NFs.split(',')
        for (const option of options) {
            if (option === '0' || option === '1' || option === '2') arraySituations.push(option)
        }
        return arraySituations
    }
})()

export async function MainNFGoiasAddQueueToProcess (settings: ISettingsNFeGoias = {}): Promise<void> {
    try {
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            headless: false,
            args: ['--start-maximized']
        })

        logger.info('1- Abrindo nova pagina')
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })

        logger.info('2- Fazendo loguin com certificado')
        await LoguinCertificado(page, browser, settings)

        logger.info('3- Pegando relacao de CNPS que este certificado tem acesso')
        const optionsCnpjs = await GetCnpjs(page, browser, settings)

        const urlActual = page.url()

        // Percorre o array de empresas
        for (const option of optionsCnpjs) {
            settings.federalRegistration = option.value
            logger.info(`4- Abrindo CNPJ ${option.label}`)

            for (const modelo of modelosNFe) {
                settings.modelNotaFiscal = modelo

                logger.info(`5- Buscando notas fiscais modelo ${settings.modelNotaFiscal}`)

                for (const situacao of situacaoNFs) {
                    settings.situationNotaFiscal = situacao

                    logger.info(`6- Buscando notas com a situacao ${settings.situationNotaFiscal}`)

                    try {
                        const periodToDown = await PeriodToDownNFeGoias(page, settings)
                        let year = periodToDown.dateStart.getFullYear()
                        const yearInicial = year
                        const yearFinal = periodToDown.dateEnd.getFullYear()
                        const monthInicial = periodToDown.dateStart.getMonth() + 1
                        const monthFinal = periodToDown.dateEnd.getMonth() + 1

                        while (year <= yearFinal) {
                            const months = functions.returnMonthsOfYear(year, monthInicial, yearInicial, monthFinal, yearFinal)

                            for (const month of months) {
                                settings.year = year
                                settings.month = month
                                const monthSring = functions.zeroLeft(month.toString(), 2)
                                logger.info(`7- Iniciando processamento do mes ${monthSring}/${year}`)
                                settings = cleanDataObject(settings, [], ['wayCertificate', 'federalRegistration', 'modelNotaFiscal', 'situationNotaFiscal', 'year', 'month'])

                                try {
                                    settings = await SetDateInicialAndFinalOfMonth(page, settings, month, year, periodToDown.dateEnd)

                                    logger.info('8- Checando se e uma empresa valida pra este periodo.')
                                    settings = await CheckIfCompanieIsValid(page, settings)
                                    await page.goto(urlActual)

                                    logger.info('9- Salvando registro pra processamento futuro.')
                                    settings.typeLog = 'to_process'
                                    settings.messageLogToShowUser = 'A Processar'
                                    settings.messageLog = 'QueueToProcess'
                                    const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
                                    await treatsMessageLog.saveLog()
                                } catch (error) {
                                    logger.info('----------------------------------')
                                }
                            }
                            year++
                        }
                    } catch (error) { logger.error(error) }
                }
            }
        }
        logger.info('[Final] - Todos os dados deste navegador foram processados, fechando navegador.')
        if (browser) await browser.close()
    } catch (error) {
        logger.error(error)
    }
}