import express from 'express'

import { job00, job09, job16 } from './jobs/NFeNFCeGO'
import { jobError, jobProcessing, jobToProcess, jobWarning } from './jobs/NFeNFCeGOReprocessErrorsOrProcessing'

const app = express()

async function process () {
    job00.start()
    job09.start()
    job16.start()
    jobError.start()
    jobProcessing.start()
    jobToProcess.start()
    jobWarning.start()
}

process().then(_ => console.log())

export default app