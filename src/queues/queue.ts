import 'dotenv/config'
import { SaveXMLsNFeNFCGOJob } from './jobs/SaveXMLsNFeNFCGO'
import { ScrapingNotesJob } from './jobs/ScrapingNotes'
import { ScrapingNotesFirstProcessingJob } from './jobs/ScrapingNotesFirstProcessing'
import { saveXMLsNFeNFCGOLib } from './lib/SaveXMLsNFeNFCGO'
import { scrapingNotesLib } from './lib/ScrapingNotes'
import { scrapingNotesFirstProcessingLib } from './lib/ScrapingNotesFirstProcessing'

saveXMLsNFeNFCGOLib.process(SaveXMLsNFeNFCGOJob.handle)
scrapingNotesLib.process(ScrapingNotesJob.handle)
scrapingNotesFirstProcessingLib.process(ScrapingNotesFirstProcessingJob.handle)