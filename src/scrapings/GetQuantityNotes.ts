import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

async function getQtdNotes (page: Page): Promise<number> {
    try {
        const qtdNotesText: string = await page.$eval('.table-legend-right-container > :nth-child(1)', element => element.textContent)
        const qtdNotes: number = Number(qtdNotesText)
        return qtdNotes
    } catch (error) {
        return 0
    }
}

export async function GetQuantityNotes (page: Page, settings: ISettingsNFeGoias): Promise<number> {
    try {
        await page.waitForTimeout(3000)
        const qtdNotes = await getQtdNotes(page)
        return qtdNotes
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'GetQuantityNotes'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao pegar quantidade das notas.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
        return 0
    }
}