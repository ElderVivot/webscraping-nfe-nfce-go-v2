import express from 'express'
import findProcess from 'find-process'
import { kill } from 'process'

import { job00 /*, job09, job16 */ } from './jobs/NFeNFCeGO'
import { jobError, jobProcessing, jobToProcess, jobWarning } from './jobs/NFeNFCeGOReprocess'

const app = express()

async function closeNodeExe () {
    try {
        const processes = await findProcess('name', 'node', true)
        for (const proc of processes) {
            try {
                if (proc.cmd.indexOf('webscraping-nfe-nfce-go-v2') >= 0) {
                    kill(proc.ppid)
                }
            } catch (error) { }
        }
    } catch (error) { }
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