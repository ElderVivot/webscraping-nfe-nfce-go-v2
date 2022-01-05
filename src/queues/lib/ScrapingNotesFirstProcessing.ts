import Queue from 'bull'

import redisConfig from '../../config/redis'
import { ScrapingNotesFirstProcessing } from '../jobs/ScrapingNotesFirstProcessing'

export const scrapingNotesFirstProcessing = new Queue(ScrapingNotesFirstProcessing.key, { redis: redisConfig })