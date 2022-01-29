import Queue from 'bull'

import redisConfig from '@config/redis'

import { ScrapingNotesFirstProcessingJob } from '../jobs/ScrapingNotesFirstProcessing'

export const scrapingNotesFirstProcessingLib = new Queue(ScrapingNotesFirstProcessingJob.key, { redis: redisConfig })