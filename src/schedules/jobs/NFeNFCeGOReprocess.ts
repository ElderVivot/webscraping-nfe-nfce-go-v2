import { CronJob } from 'cron'

import { IDateAdapter } from '@common/adapters/date/date-adapter'
import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'
import { scrapingNotesLib } from '@queues/lib/ScrapingNotes'
import { ILogNotaFiscalApi, ISettingsNFeGoias, TTaxRegime, TTypeLogNotaFiscal } from '@scrapings/_interfaces'
import { urlBaseApi } from '@scrapings/_urlBaseApi'

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
                try {
                    if (logNotaFiscal.typeLog === 'warning' && logNotaFiscal.messageError === 'COMPANIE_IS_NOT_STATE_GO') continue
                    const settings: ISettingsNFeGoias = {
                        typeProcessing: 'MainNFGoiasProcessTheQueue',
                        idLogNotaFiscal: logNotaFiscal.idLogNotaFiscal,
                        wayCertificate: logNotaFiscal.wayCertificate,
                        federalRegistration: logNotaFiscal.federalRegistration,
                        modelNotaFiscal: logNotaFiscal.modelNotaFiscal,
                        situationNotaFiscal: logNotaFiscal.situationNotaFiscal,
                        typeLog,
                        qtdTimesReprocessed: logNotaFiscal.qtdTimesReprocessed,
                        dateStartDown: new Date(logNotaFiscal.dateStartDown),
                        dateEndDown: new Date(logNotaFiscal.dateEndDown),
                        pageInicial: logNotaFiscal.pageInicial,
                        pageFinal: logNotaFiscal.pageFinal
                    }

                    const jobId = `${logNotaFiscal.idCompanie}_${logNotaFiscal.federalRegistration}_${logNotaFiscal.modelNotaFiscal}_${logNotaFiscal.situationNotaFiscal}_${dateFactory.formatDate(settings.dateStartDown, 'yyyyMMdd')}_${dateFactory.formatDate(settings.dateEndDown, 'yyyyMMdd')}`
                    const job = await scrapingNotesLib.getJob(jobId)
                    if (job?.finishedOn) await job.remove() // remove job if already fineshed to process again, if dont fineshed yet, so dont process

                    await scrapingNotesLib.add({
                        settings
                    }, {
                        jobId,
                        priority: priorityQueue(logNotaFiscal.taxRegime)
                    })

                    logger.info(`- Reprocessando scraping ${logNotaFiscal.idLogNotaFiscal} referente ao certificado ${logNotaFiscal.wayCertificate} modelo ${logNotaFiscal.modelNotaFiscal} periodo ${logNotaFiscal.dateStartDown} a ${logNotaFiscal.dateEndDown}`)
                } catch (error) {
                    logger.error({
                        msg: `- Erro ao reprocessar scraping ${logNotaFiscal.idLogNotaFiscal} referente ao certificado ${logNotaFiscal.wayCertificate} modelo ${logNotaFiscal.modelNotaFiscal} periodo ${logNotaFiscal.dateStartDown} a ${logNotaFiscal.dateEndDown}`,
                        locationFile: __filename,
                        error
                    })
                }
            }
        }
    } catch (error) {
        handlesFetchError(error, __filename)
    }
}

export const jobError = new CronJob(
    '30 * * * *',
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
    '50 * * * *',
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