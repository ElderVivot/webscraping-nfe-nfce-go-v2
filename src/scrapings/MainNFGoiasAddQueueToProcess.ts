import 'dotenv/config'

import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { logger } from '@common/log'
import { urlBaseApi } from '@scrapings/_urlBaseApi'
import { cleanDataObject } from '@utils/clean-data-object'
import * as functions from '@utils/functions'

import { ICompanies, ISettingsNFeGoias, TModelNotaFiscal, TSituationNotaFiscal } from './_interfaces'
import { CheckIfCompanieIsValid } from './CheckIfCompanieIsValid'
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

export class MainNFGoiasAddQueueToProcess {
    async process (): Promise<void> {
        let settings: ISettingsNFeGoias = {}
        logger.info('- Processando empresas pra adicionar na fila')
        const fetchFactory = makeFetchImplementation()

        const urlBase = `${urlBaseApi}/companie`
        const response = await fetchFactory.get<ICompanies[]>(`${urlBase}`, { headers: { tenant: process.env.TENANT } })
        if (response.status >= 400) throw response
        const data = response.data

        if (data.length > 0) {
            for (const companie of data) {
                if (companie.eCpfCnpjCert !== 'eCNPJ') continue // only cnpj process

                settings.federalRegistration = companie.federalRegistration
                for (const modelo of modelosNFe) {
                    settings.modelNotaFiscal = modelo
                    for (const situacao of situacaoNFs) {
                        settings.situationNotaFiscal = situacao
                        try {
                            const periodToDown = await PeriodToDownNFeGoias(situacao)
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
                                    // const monthSring = functions.zeroLeft(month.toString(), 2)
                                    settings = cleanDataObject(settings, [], ['typeProcessing', 'wayCertificate', 'federalRegistration', 'modelNotaFiscal', 'situationNotaFiscal', 'year', 'month'])

                                    try {
                                        settings = await SetDateInicialAndFinalOfMonth(settings, month, year, periodToDown.dateEnd)

                                        settings = await CheckIfCompanieIsValid(settings, companie)

                                        settings.typeLog = 'to_process'
                                        settings.messageLogToShowUser = 'A Processar'
                                        settings.messageLog = 'QueueToProcess'
                                        logger.info(`- Adicionando na fila empresa ${companie.codeCompanieAccountSystem} - ${companie.name} | ${settings.dateStartDown} a ${settings.dateEndDown}`)
                                        const treatsMessageLog = new TreatsMessageLogNFeGoias(null, settings, null, true)
                                        await treatsMessageLog.saveLog()
                                    } catch (error) {
                                        if (error.toString().indexOf('TreatsMessageLog') < 0) logger.error(error)
                                    }
                                }
                                year++
                            }
                        } catch (error) { logger.error(error) }
                    }
                }
            }
        }
    }
}