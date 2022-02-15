import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

interface IElement extends Element {
    value: string
}

export async function ChangeCnpj (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForSelector('#cmpCnpj')
        // await page.select('#cmpCnpj', settings.federalRegistration)

        await page.evaluate((federalRegistration, selector) => {
            const sel = document.querySelector<IElement>(selector)
            for (const option of [...Array.from(document.querySelectorAll<IElement>(selector + ' option'))]) {
                if (federalRegistration === option.value) sel.value = option.value
            }
        }, settings.federalRegistration, '#cmpCnpj')
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'ChangeCnpj'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao abrir página com este CNPJ.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}