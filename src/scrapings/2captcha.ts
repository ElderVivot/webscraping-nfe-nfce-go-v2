import poll from 'promise-poller'
import request from 'request-promise-native'
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
        json: 1
    }
    const response = await request.post('http://2captcha.com/in.php', { form: formData })
    return JSON.parse(response).request
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

function requestCaptchaResults (requestId: any) {
    const url = `http://2captcha.com/res.php?key=${process.env.API_2CAPTCHA}&action=get&id=${requestId}&json=1`
    return async function () {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async function (resolve, reject) {
            const rawResponse = await request.get(url)
            const resp = JSON.parse(rawResponse)
            if (resp.status === 0) return reject(resp.request)
            resolve(resp.request)
        })
    }
}

const timeout = (millis: number): Promise<unknown> => new Promise(resolve => setTimeout(resolve, millis))

export { initiateCaptchaRequest, pollForRequestResults, requestCaptchaResults, timeout }