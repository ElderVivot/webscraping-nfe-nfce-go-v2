import { CronJob } from 'cron'
import { format } from 'date-fns-tz'

import GetLogNfeNfceErrorsOrProcessing from '../../controllers/GetLogNfeNfceErrorsOrProcessing'
import TTypeLog from '../../models/TTypeLog'
import { scrapingNotes } from '../../queues/lib/ScrapingNotes'
import { ISettingsNFeGoias } from '../../scrapings/nfegoias/ISettingsNFeGoias'

async function processNotes (typeLog: TTypeLog) {
    const getLogNfeNfceErrorsOrProcessing = new GetLogNfeNfceErrorsOrProcessing()
    const logNfeNfceErrors = await getLogNfeNfceErrorsOrProcessing.get(`?typeLog=${typeLog}`)
    if (logNfeNfceErrors) {
        for (const log of logNfeNfceErrors) {
            const hourLogToCreateFolder = format(new Date(), 'yyyy-MM-dd_hh-mm-ss_a', { timeZone: 'America/Sao_Paulo' })
            const hourLog = format(new Date(), 'yyyy-MM-dd hh:mm:ss a', { timeZone: 'America/Sao_Paulo' })

            try {
                const settings: ISettingsNFeGoias = {
                    id: log.id,
                    dateHourProcessing: hourLogToCreateFolder,
                    hourLog: hourLog,
                    wayCertificate: log.wayCertificate,
                    cgceCompanie: log.cgceCompanie,
                    modelNF: log.modelNF,
                    situacaoNF: log.situacaoNF,
                    typeLog,
                    qtdTimesReprocessed: log.qtdTimesReprocessed,
                    dateStartDown: log.dateStartDown,
                    dateEndDown: log.dateEndDown,
                    pageInicial: log.pageInicial,
                    pageFinal: log.pageFinal
                }

                const jobId = `${log.id}_${log.cgceCompanie}_${log.modelNF}_${log.situacaoNF}`
                const job = await scrapingNotes.getJob(jobId)
                if (job?.finishedOn) await job.remove()

                await scrapingNotes.add({
                    settings
                }, {
                    jobId
                })

                console.log(`*- Reprocessando scraping ${settings.id} referente ao certificado ${settings.wayCertificate} modelo periodo ${settings.dateStartDown} a ${settings.dateEndDown} modelo ${settings.modelNF}`)
            } catch (error) {
                console.log(`*- Erro ao processar certificado ${log.wayCertificate}. O erro é ${error}`)
            }
        }
    }
}

export const jobError = new CronJob(
    '30 * * * *',
    async function () {
        try {
            await processNotes('error')
        } catch (error) {
            console.log(`- Erro ao reprocessar errors: ${error}`)
        }
    },
    null,
    true
)

export const jobProcessing = new CronJob(
    '15 * * * *',
    async function () {
        try {
            await processNotes('processing')
        } catch (error) {
            console.log(`- Erro ao reprocessar processing: ${error}`)
        }
    },
    null,
    true
)

export const jobToProcess = new CronJob(
    '50 * * * *',
    async function () {
        try {
            await processNotes('to_process')
        } catch (error) {
            console.log(`- Erro ao reprocessar to_process: ${error}`)
        }
    },
    null,
    true
)

// processNotes('error').then(_ => console.log(_))