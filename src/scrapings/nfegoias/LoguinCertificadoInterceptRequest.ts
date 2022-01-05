import fs from 'fs'
import path from 'path'
import { Browser, Page, Request } from 'puppeteer'
import request, { CoreOptions } from 'request'

import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

async function interceptRequest (interceptedRequest: Request, settings: ISettingsNFeGoias): Promise<void> {
    const uri = interceptedRequest.url()
    const options: CoreOptions = {
        method: interceptedRequest.method(),
        headers: interceptedRequest.headers(),
        body: interceptedRequest.postData(),
        agentOptions: {
            requestCert: true,
            rejectUnauthorized: false,
            pfx: settings.dataCertificate,
            passphrase: settings.password,
            keepAlive: true
        }
    }
    request(uri, options, function (err, resp, body) {
        if (uri.endsWith('.ico') || uri.endsWith('.png')) {
            return interceptedRequest.continue()
        }
        if (err) {
            console.error(`Unable to call ${uri}`, err)
            return interceptedRequest.abort('connectionrefused')
        }
        const optionsRespond = {
            status: resp.statusCode,
            contentType: resp.headers['content-type'],
            headers: { ...resp.headers, 'set-cookie': '' },
            body: body
        }
        interceptedRequest.respond(optionsRespond)
    })
}

export const LoguinCertificadoInterceptRequest = async (page: Page, browser: Browser, settings: ISettingsNFeGoias): Promise<void> => {
    try {
        const extensionFile = path.extname(settings.wayCertificate)
        const nameFileOriginal = path.basename(settings.wayCertificate)
        const nameFileOriginalSplit = nameFileOriginal.split('-')
        const password = nameFileOriginalSplit[1].replace(extensionFile, '')

        settings.password = password
        settings.dataCertificate = fs.readFileSync(settings.wayCertificate)
        await page.goto('https://nfe.sefaz.go.gov.br/nfeweb/sites/nfe/consulta-publica/principal', { timeout: 180000 })
        await page.setRequestInterception(true)
        page.on('request', async intercept => await interceptRequest(intercept, settings))
        await page.waitForTimeout(3000)
        await page.click("a[href*='nfe.sefaz.go.gov'] > button")
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'LoguinCertificadoInterceptRequest'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao fazer loguin com o certificado.'
        console.log(`[Final] - ${settings.messageLogToShowUser}`)
        console.log('-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, browser)
        // dont save in database because dont have information necessary to reprocess
        await treatsMessageLog.saveLog(false)
    }
}

// async function test () {
//     const browser = await puppeteer.launch({
//         ignoreHTTPSErrors: true,
//         headless: false,
//         args: ['--start-maximized']
//         // devtools: true,
//         // executablePath: path.join('C:', 'Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe')
//     })

//     console.log('1- Abrindo nova página')
//     const page = await browser.newPage()
//     await page.setViewport({ width: 0, height: 0 })

//     await LoguinCertificadoInterceptRequest(page, browser, { wayCertificate: 'C:\\certificados-processados\\ok\\A L R ELETRICA EIRELI18040800000100-1062reis.pfx' })
// }

// test().then(_ => console.log(_))