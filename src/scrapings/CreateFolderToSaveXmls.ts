import path from 'path'
import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './_interfaces'
import { createFolderToSaveData } from './CreateFolderToSaveData'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function CreateFolderToSaveXmls (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        if (!settings.qtdNotes) {
            throw 'NOT_EXIST_NOTES_TO_DOWN'
        }
        const pathNote = await createFolderToSaveData(settings)
        const client = await page.target().createCDPSession()
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.resolve(pathNote)
        })
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'CreateFolderToSaveXmls'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao criar pasta pra salvar os xmls.'
        if (error === 'NOT_EXIST_NOTES_TO_DOWN') {
            settings.messageLogToShowUser = 'Apesar de ter passado pelo captcha e nao ter dado aviso de sem notas ele nao encontrou nada no download.'
        }

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}