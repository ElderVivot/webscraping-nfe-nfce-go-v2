import { CronJob } from 'cron'

import { IDateAdapter } from '@common/adapters/date/date-adapter'
import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'
import { scrapingNotesLib } from '@queues/lib/ScrapingNotes'
import { ILogNotaFiscalApi, ISettingsNFeGoias, TTaxRegime, TTypeLogNotaFiscal } from '@scrapings/_interfaces'
import { urlBaseApi } from '@scrapings/_urlBaseApi'
import { CheckIfCompanieIsValid } from '@scrapings/CheckIfCompanieIsValid'

function getDateStartAndEnd (dateFactory: IDateAdapter) {
    const dateStart = dateFactory.subMonths(new Date(), Number(process.env.RETROACTIVE_MONTHS_TO_DOWNLOAD) || 0)
    dateStart.setDate(1)

    const dateEnd = new Date()

    return {
        dateStartString: dateFactory.formatDate(dateStart, 'yyyy-MM-dd'),
        dateEndString: dateFactory.formatDate(dateEnd, 'yyyy-MM-dd')
    }
}

function priorityQueue (taxRegime: TTaxRegime) {
    if (taxRegime === '01') return 1
    else if (taxRegime === '02') return 2
    else if (taxRegime === '03') return 3
    else return 3
}

async function processNotes (typeLog: TTypeLogNotaFiscal) {
    try {
        const fetchFactory = makeFetchImplementation()
        const dateFactory = makeDateImplementation()

        const { dateStartString, dateEndString } = getDateStartAndEnd(dateFactory)

        const urlBase = `${urlBaseApi}/log_nota_fiscal`
        const urlFilter = `?typeLog=${typeLog}&dateStartDownBetween=${dateStartString}&dateEndDownBetween=${dateEndString}`
        const response = await fetchFactory.get<ILogNotaFiscalApi[]>(`${urlBase}${urlFilter}`, { headers: { tenant: process.env.TENANT } })
        if (response.status >= 400) throw response
        const data = response.data

        if (data.length > 0) {
            for (const logNotaFiscal of data) {
                if (logNotaFiscal.modelNotaFiscal === '57') continue // site goias with problem

                try {
                    let settings: ISettingsNFeGoias = {
                        idLogNotaFiscal: logNotaFiscal.idLogNotaFiscal,
                        idCompanie: logNotaFiscal.idCompanie,
                        wayCertificate: logNotaFiscal.wayCertificate,
                        federalRegistration: logNotaFiscal.federalRegistration,
                        codeCompanieAccountSystem: logNotaFiscal.codeCompanieAccountSystem,
                        nameCompanie: logNotaFiscal.nameCompanie,
                        modelNotaFiscal: logNotaFiscal.modelNotaFiscal,
                        situationNotaFiscal: logNotaFiscal.situationNotaFiscal,
                        typeLog,
                        qtdTimesReprocessed: logNotaFiscal.qtdTimesReprocessed,
                        dateStartDown: new Date(logNotaFiscal.dateStartDown),
                        dateEndDown: new Date(logNotaFiscal.dateEndDown),
                        pageInicial: logNotaFiscal.pageInicial,
                        pageFinal: logNotaFiscal.pageFinal,
                        urlPrintLog: logNotaFiscal.urlPrintLog
                    }

                    if (settings.federalRegistration.length < 14) {
                        throw `TreatsMessageLog - Dont CNPJ, is a CPF ${settings.federalRegistration}`
                    }

                    settings = await CheckIfCompanieIsValid(settings)

                    const jobId = `${logNotaFiscal.idCompanie}_${logNotaFiscal.federalRegistration}_${logNotaFiscal.modelNotaFiscal}_${logNotaFiscal.situationNotaFiscal}_${dateFactory.formatDate(settings.dateStartDown, 'yyyyMMdd')}_${dateFactory.formatDate(settings.dateEndDown, 'yyyyMMdd')}`
                    const job = await scrapingNotesLib.getJob(jobId)
                    if (job?.finishedOn) await job.remove() // remove job if already fineshed to process again, if dont fineshed yet, so dont process

                    await scrapingNotesLib.add({
                        settings
                    }, {
                        jobId,
                        priority: priorityQueue(logNotaFiscal.taxRegime)
                    })

                    logger.info(`- Reprocessando scraping ${logNotaFiscal.idLogNotaFiscal} referente a empresa ${logNotaFiscal.codeCompanieAccountSystem} - ${logNotaFiscal.nameCompanie} modelo ${logNotaFiscal.modelNotaFiscal} periodo ${logNotaFiscal.dateStartDown} a ${logNotaFiscal.dateEndDown}`)
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

// processNotes('error').then(_ => console.log(_))
// processNotes('to_process').then(_ => console.log(_))
// processNotes('warning').then(_ => console.log(_))

export const jobError = new CronJob(
    '12 * * * *',
    async function () {
        await processNotes('error')
    },
    null,
    true
)

export const jobProcessing = new CronJob(
    '15 * * * *',
    async function () {
        await processNotes('processing')
    },
    null,
    true
)

export const jobToProcess = new CronJob(
    '45 * * * *',
    async function () {
        await processNotes('to_process')
    },
    null,
    true
)

export const jobWarning = new CronJob(
    '05 12 * * *',
    async function () {
        await processNotes('warning')
    },
    null,
    true
)