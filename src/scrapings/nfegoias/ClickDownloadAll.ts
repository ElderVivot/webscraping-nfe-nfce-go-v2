import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ClickDownloadAll (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForTimeout(2000)
        await page.waitForSelector('.btn-download-all')
        await page.click('.btn-download-all')
    } catch (error) {
        // when already processing before then dont save in database again because duplicate registry of scraping, only save is reprocessing
        const saveInDB = settings.typeLog !== 'processing' || !!settings.id
        settings.typeLog = 'error'
        settings.messageLog = 'ClickDownloadAll'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao clicar pra baixar todas as notas.'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}