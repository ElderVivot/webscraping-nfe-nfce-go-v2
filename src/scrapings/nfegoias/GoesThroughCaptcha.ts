import { Page } from 'puppeteer'

import { promiseTimeOut } from '../../utils/promise-timeout'
import { initiateCaptchaRequest, pollForRequestResults } from '../2captcha'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

const siteDetails = {
    sitekey: '6LfTFzIUAAAAAKINyrQ9X5LPg4W3iTbyyYKzeUd3',
    pageurl: 'https://nfe.sefaz.go.gov.br/nfeweb/sites/nfe/consulta-publica'
}

async function captcha () {
    const requestId = await initiateCaptchaRequest(siteDetails)
    const response = await pollForRequestResults(requestId)
    return response
}

export async function GoesThroughCaptcha (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        // time out 3 minutes if captcha not return results
        const response = await Promise.race([captcha(), promiseTimeOut(180000)])
        if (response === 'TIME_EXCEED') {
            throw 'TIME EXCEED - GOES THROUGH CAPTCHA'
        }

        await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`)
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 500000 }),
            page.click("button[form='filtro']")
        ])
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'GoesThroughCaptcha'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao passar pelo captcha.'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}