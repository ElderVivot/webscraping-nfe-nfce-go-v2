import { Page } from 'playwright'

import 'dotenv/config'
// import ac from '@antiadmin/anticaptchaofficial'
import { promiseTimeOut } from '@utils/promise-timeout'

import { ISettingsNFeGoias } from './_interfaces'
import { initiateCaptchaRequest, pollForRequestResults } from './2captcha'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

const siteDetails = {
    sitekey: '6LfEDl0mAAAAABhWuNT4woNL9joLptNe4rzEq4fr',
    pageurl: 'https://nfeweb.sefaz.go.gov.br/nfeweb/sites/nfe/consulta-publica'
}

async function captcha () {
    const requestId = await initiateCaptchaRequest(siteDetails)
    const response = await pollForRequestResults(requestId)
    return response
}

// ac.setAPIKey(process.env.ANTI_CAPTCHA)

export async function GoesThroughCaptcha (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        // time out 3 minutes if captcha not return results
        const response = await Promise.race([captcha(), promiseTimeOut(180000)])
        if (response === 'TIME_EXCEED') {
            throw 'TIME EXCEED - GOES THROUGH CAPTCHA'
        }

        // const grecaptcha: any = await page.evaluate('grecaptcha')
        // console.log(grecaptcha)
        // const token = await ac.solveRecaptchaV3(siteDetails.pageurl, siteDetails.sitekey, 0.9, 'submit')

        // if (!token) {
        //     console.log('something went wrong')
        //     return
        // }
        // settings.tokenCaptcha = token

        // const grecaptcha: any = {}
        // await page.evaluate((token) => {
        //     grecaptcha.execute = function (sitekey, payLoad) {
        //         console.log('called replaced execute function with sitekey ' + sitekey + ' and payload ', payLoad)
        //         return new Promise((resolve) => {
        //             resolve(token)
        //         })
        //     }
        // }, settings.tokenCaptcha)

        await Promise.all([
            page.waitForURL(/cmpCnpj/i, { timeout: 500000 }),
            page.click('#btnPesquisar')
        ])
    } catch (error) {
        console.log(error)
        settings.typeLog = 'error'
        settings.messageLog = 'GoesThroughCaptcha'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao passar pelo captcha.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}