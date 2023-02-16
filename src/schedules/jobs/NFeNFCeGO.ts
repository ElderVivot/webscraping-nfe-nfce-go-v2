import { CronJob } from 'cron'

import { logger } from '@common/log'
import { MainNFGoiasAddQueueToProcess } from '@scrapings/MainNFGoiasAddQueueToProcess'

async function processNotes () {
    try {
        const mainNFGoiasAddQueue = new MainNFGoiasAddQueueToProcess()
        await mainNFGoiasAddQueue.process()
    } catch (error) {
        logger.error(`- Erro ao processar baixa de notas ${error}`)
    }
}

export const job00 = new CronJob(
    '03 00 * * *',
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