import { Page } from 'puppeteer'

import { saveXMLsNFeNFCGOLib } from '@queues/lib/SaveXMLsNFeNFCGO'

import { ISettingsNFeGoias } from './_interfaces'
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
        await saveXMLsNFeNFCGOLib.add({
            pathThatTheFileIsDownloaded: lastDownload.filePath,
            settings
        })
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'SendLastDownloadToQueue'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao enviar pra fila o ultimo download realizado.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}