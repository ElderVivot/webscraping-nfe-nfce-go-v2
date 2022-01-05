import { Page } from 'puppeteer'

import { treateTextField } from '../../utils/functions'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function CheckIfSemResultados (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForTimeout(2000)
        const semResultadoOriginal: string = await page.$eval('#message-containter > div:nth-child(1)', element => element.textContent)
        const semResultado = semResultadoOriginal ? treateTextField(semResultadoOriginal) : ''
        if (semResultado.indexOf('SEM RESULTADO') >= 0) {
            throw 'NOT_EXIST_NOTES'
        }
        if (semResultado.indexOf('CAPTCHA INVALIDO') >= 0) {
            throw 'CAPTCHA_INVALID'
        }
    } catch (error) {
        if (error === 'NOT_EXIST_NOTES' || error === 'CAPTCHA_INVALID') {
            settings.messageLog = 'CheckIfSemResultados'
            settings.messageError = error

            if (error === 'NOT_EXIST_NOTES') {
                settings.typeLog = 'warning'
                settings.messageLogToShowUser = 'Não há notas no período informado.'
            } else if (error === 'CAPTCHA_INVALID') {
                settings.typeLog = 'error'
                settings.messageLogToShowUser = 'Erro ao passar pelo Captcha.'
            }

            console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
            console.log('\t-------------------------------------------------')

            const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
            await treatsMessageLog.saveLog()
        }
    }
}