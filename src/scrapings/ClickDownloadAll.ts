import { Page } from 'playwright'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ClickDownloadAll (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForTimeout(2000)
        await page.waitForSelector('.btn-download-all')
        try {
            await page.click('.last-click > a')
        } catch (error) {

        }
        await page.click('.btn-download-all')
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'ClickDownloadAll'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao clicar pra baixar todas as notas.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}