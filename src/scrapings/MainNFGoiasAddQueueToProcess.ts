import 'dotenv/config'

import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'
import { scrapingNotesLib } from '@queues/lib/ScrapingNotes'
import { urlBaseApi } from '@scrapings/_urlBaseApi'
import { cleanDataObject } from '@utils/clean-data-object'
import * as functions from '@utils/functions'

import { ICompanies, ISettingsNFeGoias, TModelNotaFiscal, TSituationNotaFiscal, TTaxRegime } from './_interfaces'
import { CheckIfCompanieIsValid } from './CheckIfCompanieIsValid'
import { PeriodToDownNFeGoias } from './PeriodToDownNFeGoias'

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

function priorityQueue (taxRegime: TTaxRegime) {
    if (taxRegime === '01') return 1
    else if (taxRegime === '02') return 2
    else if (taxRegime === '03') return 3
    else return 3
}

export class MainNFGoiasAddQueueToProcess {
    async process (): Promise<void> {
        let settings: ISettingsNFeGoias = {}
        logger.info('- Processando empresas pra adicionar na fila')
        const fetchFactory = makeFetchImplementation()
        const dateFactory = makeDateImplementation()
        const today = new Date()
        const todaySub32Days = dateFactory.subDays(today, 32)

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

                            settings = cleanDataObject(settings, [], ['typeProcessing', 'wayCertificate', 'federalRegistration', 'modelNotaFiscal', 'situationNotaFiscal', 'year', 'month'])

                            try {
                                const { firstDay, lastDay } = functions.firstAndLastDayOfMonth(month, year)
                                const firstDayString = dateFactory.formatDate(firstDay, 'yyyy-MM-dd')
                                const lastDayString = dateFactory.formatDate(lastDay, 'yyyy-MM-dd')

                                // logger.info(`- Processando modelo ${modelo} situacao ${situacao}  - ${firstDayString} a ${lastDayString}`)

                                if (year === yearFinal && month === monthFinal) {
                                    settings.typeSearch = 'fractional'
                                    settings.dateEndDown = periodToDown.dateEnd
                                } else {
                                    settings.typeSearch = 'complete'
                                    settings.dateEndDown = lastDay
                                }
                                if (settings.situationNotaFiscal === '2') settings.typeSearch = 'fractional'

                                const urlBase = `${urlBaseApi}/log_nota_fiscal`
                                const urlFilter = `/get_companies_that_dont_process_yet?dateStartDownBetween=${firstDayString}&dateEndDownBetween=${lastDayString}&modelNotaFiscal=${settings.modelNotaFiscal}&situationNotaFiscal=${settings.situationNotaFiscal}&typeSearch=${settings.typeSearch}`
                                const response = await fetchFactory.get<ICompanies[]>(`${urlBase}${urlFilter}`, { headers: { tenant: process.env.TENANT } })
                                if (response.status >= 400) throw response
                                const companies = response.data

                                if (companies.length > 0) {
                                    for (const companie of companies) {
                                        try {
                                            if (companie.dateEndDown) {
                                                const dateEndDownCompanie = new Date(companie.dateEndDown)

                                                // companie already processed
                                                if (dateEndDownCompanie >= new Date(settings.dateEndDown)) continue
                                                else settings.dateStartDown = dateFactory.addDays(dateEndDownCompanie, 1)
                                            } else {
                                                settings.dateStartDown = firstDay
                                            }

                                            // dateStart and dateEnd is equal
                                            if (settings.dateStartDown >= settings.dateEndDown) continue

                                            if (settings.situationNotaFiscal === '2' && todaySub32Days > lastDay) {
                                                logger.info('NOTE_CANCELED_DONT_DOWN_SEPARATELY_IF_MORE_31_DAYS')
                                                continue
                                            }

                                            settings = await CheckIfCompanieIsValid(settings, companie)

                                            settings.typeLog = 'to_process'
                                            settings.messageLogToShowUser = 'A Processar'
                                            settings.messageLog = 'QueueToProcess'
                                            settings.pageInicial = 0
                                            settings.pageFinal = 0
                                            settings.qtdNotes = 0
                                            settings.qtdTimesReprocessed = 0
                                            settings.qtdPagesTotal = 0
                                            settings.urlPrintLog = ''

                                            logger.info(`- Adicionando na fila empresa ${companie.codeCompanieAccountSystem} - ${companie.name} | ${settings.dateStartDown.toISOString()} a ${settings.dateEndDown.toISOString()} | ${settings.modelNotaFiscal} - ${settings.situationNotaFiscal}`)

                                            const jobId = `${settings.idCompanie}_${settings.federalRegistration}_${settings.modelNotaFiscal}_${settings.situationNotaFiscal}_${dateFactory.formatDate(settings.dateStartDown, 'yyyyMMdd')}_${dateFactory.formatDate(settings.dateEndDown, 'yyyyMMdd')}`
                                            const job = await scrapingNotesLib.getJob(jobId)
                                            if (job?.finishedOn) await job.remove() // remove job if already fineshed to process again, if dont fineshed yet, so dont process

                                            await scrapingNotesLib.add({
                                                settings
                                            }, {
                                                jobId,
                                                priority: priorityQueue(companie.taxRegime)
                                            })
                                        } catch (error) {
                                            if (error.toString().indexOf('TreatsMessageLog') < 0) {
                                                logger.error(error)
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                const responseFetch = handlesFetchError(error)
                                if (responseFetch) logger.error(responseFetch)
                                else logger.error(error)
                            }
                        }
                        year++
                    }
                } catch (error) {
                    logger.error(error)
                }
            }
        }
        //     }
        // }
    }
}