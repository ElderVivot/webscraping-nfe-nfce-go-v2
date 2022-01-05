import { CronJob } from 'cron'

import NFeNFCeGO from '../../scrapings/nfegoias/index'

async function processNotes () {
    try {
        const applicattion = new NFeNFCeGO()
        await applicattion.process()
    } catch (error) {
        console.log(`- Erro ao processar baixa de notas ${error}`)
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

export const job09 = new CronJob(
    '03 09 * * *',
    async function () {
        await processNotes()
    },
    null,
    true
)

export const job16 = new CronJob(
    '03 16 * * *',
    async function () {
        await processNotes()
    },
    null,
    true
)