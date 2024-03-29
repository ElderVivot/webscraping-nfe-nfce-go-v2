import { Page } from 'playwright'

import { treateTextField } from '@utils/functions'

import { ISettingsNFeGoias } from './_interfaces'
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
        if (semResultado.indexOf('HOUVE UM ERRO NA OPERA') >= 0) {
            throw 'ERROR_SEARCH_NOTES_AFTER_CAPTCHA'
        }
    } catch (error) {
        if (error === 'NOT_EXIST_NOTES' || error === 'CAPTCHA_INVALID') {
            settings.messageLog = 'CheckIfSemResultados'
            settings.messageError = error
            if (error === 'NOT_EXIST_NOTES') {
                settings.typeLog = 'success'
                settings.messageLogToShowUser = 'Não há notas no período informado.'
            } else if (error === 'CAPTCHA_INVALID') {
                settings.typeLog = 'error'
                settings.messageLogToShowUser = 'Erro ao passar pelo Captcha.'
            } else if (error === 'ERROR_SEARCH_NOTES_AFTER_CAPTCHA') {
                settings.typeLog = 'error'
                settings.messageLogToShowUser = 'Erro ao consultar as notas.'
            }

            const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
            await treatsMessageLog.saveLog()
        }
    }
}