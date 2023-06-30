import path from 'path'
import { Page } from 'playwright'

import { saveXMLsNFeNFCGOLib } from '@queues/lib/SaveXMLsNFeNFCGO'

import { ISettingsNFeGoias } from './_interfaces'
import { createFolderToSaveData } from './CreateFolderToSaveData'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ClickDownloadModal (page: Page, settings: ISettingsNFeGoias): Promise<number> {
    try {
        await page.waitForTimeout(2000)
        await page.waitForSelector('#dnwld-all-btn-ok')
        await page.click('#cmpPagPer')
        await page.type('#cmpPagIni', String(settings.pageInicial))
        await page.type('#cmpPagFin', String(settings.pageFinal))

        const pathNote = await createFolderToSaveData(settings)

        const [download] = await Promise.all([
            page.waitForEvent('download',
                { timeout: 300000 } // 5 minutes
            ),
            await page.click('#dnwld-all-btn-ok')
        ])

        const pathToSaveXml = path.resolve(pathNote, download.suggestedFilename())
        await download.saveAs(pathToSaveXml)

        await saveXMLsNFeNFCGOLib.add({
            pathThatTheFileIsDownloaded: pathToSaveXml,
            settings
        })
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