import 'dotenv/config'
import { SaveXMLsNFeNFCGOJob } from './jobs/SaveXMLsNFeNFCGO'
import { ScrapingNotesJob } from './jobs/ScrapingNotes'
import { saveXMLsNFeNFCGOLib } from './lib/SaveXMLsNFeNFCGO'
import { scrapingNotesLib } from './lib/ScrapingNotes'

saveXMLsNFeNFCGOLib.process(SaveXMLsNFeNFCGOJob.handle)
scrapingNotesLib.process(ScrapingNotesJob.handle)