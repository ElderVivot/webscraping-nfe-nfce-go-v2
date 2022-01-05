import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ChangeCnpj (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForSelector('#cmpCnpj')
        await page.select('#cmpCnpj', settings.cgceCompanie)
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'ChangeCnpj'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao abrir página com este CNPJ.'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}