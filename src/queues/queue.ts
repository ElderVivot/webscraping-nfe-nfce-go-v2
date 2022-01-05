import 'dotenv/config'
import SaveXMLsNFeNFCGO from './jobs/SaveXMLsNFeNFCGO'
import { ScrapingNotes } from './jobs/ScrapingNotes'
import { ScrapingNotesFirstProcessing } from './jobs/ScrapingNotesFirstProcessing'
import SaveXMLsNFeNFCGOLib from './lib/SaveXMLsNFeNFCGO'
import { scrapingNotes } from './lib/ScrapingNotes'
import { scrapingNotesFirstProcessing } from './lib/ScrapingNotesFirstProcessing'

SaveXMLsNFeNFCGOLib.process(SaveXMLsNFeNFCGO.handle)
scrapingNotes.process(ScrapingNotes.handle)
scrapingNotesFirstProcessing.process(ScrapingNotesFirstProcessing.handle)