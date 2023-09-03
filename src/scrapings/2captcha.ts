import axios from 'axios'
import poll from 'promise-poller'

import { timeout } from '@utils/functions'
import('dotenv/config')

interface ISiteDetails {
    sitekey: string,
    pageurl: string
}

async function initiateCaptchaRequest (siteDetails: ISiteDetails): Promise<any> {
    const formData = {
        method: 'userrecaptcha',
        googlekey: siteDetails.sitekey,
        key: process.env.API_2CAPTCHA,
        pageurl: siteDetails.pageurl,
        json: 1,
        version: 'v3',
        action: 'submit',
        // eslint-disable-next-line camelcase
        min_score: 0.9
    }
    const response = await axios.post('http://2captcha.com/in.php', { ...formData })
    return response.request
}

async function pollForRequestResults (id: any, retries = 70, interval = 500, delay = 500): Promise<any> {
    await timeout(delay)
    return poll({
        taskFn: requestCaptchaResults(id),
        interval,
        retries
        // progressCallback: (retriesRemaining: number, error: any) => process.stdout.write(`${retriesRemaining} ${error}\r`)
    })
}

function requestCaptchaResults (requestId: any): any {
    const url = `http://2captcha.com/res.php?key=${process.env.API_2CAPTCHA}&action=get&id=${requestId}&json=1`
    return async function () {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async function (resolve, reject) {
            const response = await axios.get(url)
            if (response.status === 0) return reject(response.request)
            resolve(response.request)
        })
    }
}

export { initiateCaptchaRequest, pollForRequestResults, requestCaptchaResults }