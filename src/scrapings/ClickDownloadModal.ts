import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ClickDownloadModal (page: Page, settings: ISettingsNFeGoias): Promise<number> {
    try {
        await page.waitForTimeout(2000)
        await page.waitForSelector('#dnwld-all-btn-ok')
        await page.click('#cmpPagPer')
        await page.type('#cmpPagIni', String(settings.pageInicial))
        await page.type('#cmpPagFin', String(settings.pageFinal))
        await page.click('#dnwld-all-btn-ok')
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'ClickDownloadModal'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao clicar pra baixar as notas na tela suspensa'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
        return 0
    }
}