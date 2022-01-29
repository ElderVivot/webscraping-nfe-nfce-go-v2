import { CronJob } from 'cron'

import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'
import { scrapingNotesLib } from '@queues/lib/ScrapingNotes'
import { ILogNotaFiscalApi, ISettingsNFeGoias, TTypeLogNotaFiscal } from '@scrapings/_interfaces'
import { urlBaseApi } from '@scrapings/_urlBaseApi'

async function processNotes (typeLog: TTypeLogNotaFiscal) {
    try {
        const fetchFactory = makeFetchImplementation()

        const urlBase = `${urlBaseApi}/log_nota_fiscal`
        const urlFilter = `?typeLog=${typeLog}`
        const response = await fetchFactory.get<ILogNotaFiscalApi[]>(`${urlBase}${urlFilter}`, { headers: { tenant: process.env.TENANT } })
        if (response.status >= 400) throw response
        const data = response.data

        if (data.length > 0) {
            for (const logNotaFiscal of data) {
                try {
                    const settings: ISettingsNFeGoias = {
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

                    const jobId = `${logNotaFiscal.idCompanie}_${logNotaFiscal.federalRegistration}_${logNotaFiscal.modelNotaFiscal}_${logNotaFiscal.situationNotaFiscal}`
                    const job = await scrapingNotesLib.getJob(jobId)
                    if (job?.finishedOn) await job.remove() // remove job if already fineshed to process again, if dont fineshed yet, so dont process

                    await scrapingNotesLib.add({
                        settings
                    }, {
                        jobId
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
    '04 * * * *',
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

// processNotes('error').then(_ => console.log(_))