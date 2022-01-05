import { zonedTimeToUtc } from 'date-fns-tz'
// import path from 'path'
import puppeteer from 'puppeteer'
import 'dotenv/config'

import { cleanDataObject } from '../../utils/clean-data-object'
import * as functions from '../../utils/functions'
import { CheckIfCompanieIsValid } from './CheckIfCompanieIsValid'
import { ChecksIfFetchInCompetence } from './ChecksIfFetchInCompetence'
import { GetCnpjs } from './GetCnpjs'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
// import { LoguinCertificadoInterceptRequest } from './LoguinCertificadoInterceptRequest'
import { LoguinCertificado } from './LoguinCertificado'
import { PeriodToDownNFeGoias } from './PeriodToDownNFeGoias'
import { SetDateInicialAndFinalOfMonth } from './SetDateInicialAndFinalOfMonth'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

const modelosNFe = process.env.MODELOS_NFs.split(',') || ['55', '65', '57']
const situacaoNFs = ['2', '3']

function typeNF (modelo: string): string {
    if (modelo === '55') return 'NF-e'
    else if (modelo === '57') return 'CT-e'
    else if (modelo === '65') return 'NFC-e'
    else return 'DESCONHECIDO'
}

function getDescriptionSituacaoNF (situacao: string): string {
    if (situacao === '2') return 'Autorizadas'
    else if (situacao === '3') return 'Canceladas'
    else return 'DESCONHECIDO'
}

export async function MainNFGoiasAddQueueToProcess (settings: ISettingsNFeGoias = {}): Promise<void> {
    try {
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            headless: false,
            args: ['--start-maximized']
            // devtools: true,
            // executablePath: path.join('C:', 'Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe')
        })

        console.log('1- Abrindo nova página')
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })

        console.log('2- Fazendo loguin com certificado')
        await LoguinCertificado(page, browser, settings)

        console.log('3- Pegando relação de CNPS que este certificado tem acesso')
        const optionsCnpjs = await GetCnpjs(page, browser, settings)

        // Pega a URL atual pra não ter que abrir do zero o processo
        const urlActual = page.url()

        // Percorre o array de empresas
        for (const option of optionsCnpjs) {
            settings.cgceCompanie = option.value
            console.log(`4- Abrindo CNPJ ${option.label}`)

            for (const modelo of modelosNFe) {
                settings.typeNF = typeNF(modelo)
                settings.modelNF = modelo

                console.log(`\t5- Buscando ${settings.typeNF}`)

                for (const situacao of situacaoNFs) {
                    settings.situacaoNF = situacao
                    settings.situacaoNFDescription = getDescriptionSituacaoNF(situacao)

                    console.log(`\t6- Buscando notas ${settings.situacaoNFDescription}`)

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
                                const monthSring = functions.zeroLeft(month.toString(), 2)
                                console.log(`\t7- Iniciando processamento do mês ${monthSring}/${year}`)
                                //  clean settings to old don't affect new process
                                settings = cleanDataObject(settings, [], ['wayCertificate', 'hourLog', 'dateHourProcessing', 'cgceCompanie', 'modelNF', 'situacaoNF', 'situacaoNFDescription', 'typeNF', 'typeLog'])

                                try {
                                    const dateInicialAndFinalOfMonth = await SetDateInicialAndFinalOfMonth(page, settings, periodToDown, month, year)

                                    settings.dateStartDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(dateInicialAndFinalOfMonth.inicialDate, 'America/Sao_Paulo')))} 03:00:00 AM`
                                    settings.dateEndDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(dateInicialAndFinalOfMonth.finalDate, 'America/Sao_Paulo')))} 03:00:00 AM`
                                    settings.year = year
                                    settings.month = monthSring
                                    settings.entradasOrSaidas = 'Saidas'

                                    await ChecksIfFetchInCompetence(page, settings)

                                    console.log('\t8- Checando se é uma empresa válida pra este período.')
                                    settings = await CheckIfCompanieIsValid(page, settings)
                                    await page.goto(urlActual)

                                    console.log('\t9- Salvando registro pra processamento futuro.')
                                    settings.typeLog = 'to_process'
                                    settings.messageLogToShowUser = 'A Processar'
                                    const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
                                    await treatsMessageLog.saveLog()

                                    console.log('\t[Final-Empresa-Mes]')
                                    console.log('\t-------------------------------------------------')
                                    // await CloseOnePage(page, 'Empresa')
                                } catch (error) { console.log(error) }
                            }
                            year++
                        }
                    } catch (error) { console.log(error) }
                }
            }
        }
        console.log('[Final] - Todos os dados deste navegador foram processados, fechando navegador.')
        await browser.close()
    } catch (error) {

    }
}

// const hourLog = format(new Date(), 'yyyy-MM-dd hh:mm:ss a', { timeZone: 'America/Sao_Paulo' })
// MainNFGoias({ hourLog }).then(_ => console.log(_))