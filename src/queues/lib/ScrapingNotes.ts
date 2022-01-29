import Queue from 'bull'

import redisConfig from '@config/redis'

import { ScrapingNotesJob } from '../jobs/ScrapingNotes'

const scrapingNotesLib = new Queue(ScrapingNotesJob.key, { redis: redisConfig })

export { scrapingNotesLib }