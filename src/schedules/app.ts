import { exec } from 'child_process'
import express from 'express'
import util from 'util'

import { job00 /*, job09, job16 */ } from './jobs/NFeNFCeGO'
import { jobError, jobProcessing, jobToProcess, jobWarning } from './jobs/NFeNFCeGOReprocess'

const execAsync = util.promisify(exec)

const app = express()

async function closeNodeExe () {
    try {
        await execAsync(`python ${__dirname}\\CloseOtherProcess.py`)
    } catch (error) {
        console.log(error)
    }
}

closeNodeExe().then(_ => console.log())

async function process () {
    job00.start()
    // job09.start()
    // job16.start()
    jobError.start()
    jobProcessing.start()
    jobToProcess.start()
    jobWarning.start()
}

process().then(_ => console.log())

export default app