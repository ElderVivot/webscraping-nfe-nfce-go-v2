import { CronJob } from 'cron'

import { logger } from '@common/log'
import { MainNFGoiasAddQueueToProcess } from '@scrapings/MainNFGoiasAddQueueToProcess'
import { mainDeleteCertificates } from '@services/certificates/windows/delete-certificates'

async function processNotes () {
    try {
        await mainDeleteCertificates(true) // delete only certificates expired
        const mainNFGoiasAddQueue = new MainNFGoiasAddQueueToProcess()
        await mainNFGoiasAddQueue.process()
    } catch (error) {
        logger.error(`- Erro ao processar baixa de notas ${error}`)
    }
}

// processNotes().then(_ => console.log(_))

export const job00 = new CronJob(
    '03 */8 * * *',
    async function () {
        await processNotes()
    },
    null,
    true
)

/* export const job09 = new CronJob(
    '03 09 * * *',
    async function () {
        await processNotes()
    },
    null,
    true
)

export const job16 = new CronJob(
    '26 20 * * *',
    async function () {
        await processNotes()
    },
    null,
    true
) */