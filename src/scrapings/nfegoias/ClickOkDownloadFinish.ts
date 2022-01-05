import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './ISettingsNFeGoias'
// import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ClickOkDownloadFinish (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForSelector('.modal-footer > .btn-info.dwnld-loading-window-cancel')
        await page.click('.modal-footer > .btn-info.dwnld-loading-window-cancel')
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'ClickOkDownloadFinish'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao clicar em "OK" após download das notas finalizados'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        // const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        // await treatsMessageLog.saveLog()
    }
}