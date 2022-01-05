import { Page } from 'puppeteer'

import SaveXMLsNFeNFCGO from '../../queues/lib/SaveXMLsNFeNFCGO'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

interface IElementDownload {
    dateString: string
    fileName: string
    filePath: string
    fileUrl: string
    state: string
    url: string
}

interface IHTMLElement extends Element {
    readonly items_: Array<IElementDownload>
}

export async function SendLastDownloadToQueue (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.goto('chrome://downloads/')
        await page.waitForTimeout(3000)

        const lastDownload = await page.evaluate(() => {
            const manager: IHTMLElement = document.querySelector('downloads-manager')

            const downloads = manager.items_.length
            const lastDownload = manager.items_[0]
            if (downloads && lastDownload.state === 'COMPLETE') {
                return manager.items_[0]
            }
        })
        await SaveXMLsNFeNFCGO.add({
            pathThatTheFileIsDownloaded: lastDownload.filePath,
            settings
        })
    } catch (error) {
        // when already processing before then dont save in database again because duplicate registry of scraping, only save is reprocessing
        const saveInDB = settings.typeLog !== 'processing' || !!settings.id
        settings.typeLog = 'error'
        settings.messageLog = 'SendLastDownloadToQueue'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao enviar pra fila o último download realizado.'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}