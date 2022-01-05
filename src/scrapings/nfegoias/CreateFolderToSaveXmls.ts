import path from 'path'
import { Page } from 'puppeteer'

import { createFolderToSaveData } from './CreateFolderToSaveData'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
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
        // when already processing before then dont save in database again because duplicate registry of scraping, only save is reprocessing
        const saveInDB = settings.typeLog !== 'processing' || !!settings.id
        settings.typeLog = 'error'
        settings.messageLog = 'CreateFolderToSaveXmls'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao criar pasta pra salvar os xmls.'
        if (error === 'NOT_EXIST_NOTES_TO_DOWN') {
            settings.messageLogToShowUser = 'Apesar de ter passado pelo captcha e não ter dado aviso de sem notas ele não encontrou nada no download.'
        }
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}