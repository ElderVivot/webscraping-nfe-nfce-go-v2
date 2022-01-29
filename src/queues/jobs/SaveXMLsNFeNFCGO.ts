import fsExtra from 'fs-extra'
import path from 'path'

import { logger } from '@common/log'
import { ISettingsNFeGoias } from '@scrapings/_interfaces'
import { createFolderToSaveData } from '@scrapings/CreateFolderToSaveData'

export const SaveXMLsNFeNFCGOJob = {
    key: 'SaveXMLsNFeNFCGO',
    async handle ({ data }): Promise<void> {
        const settings: ISettingsNFeGoias = data.settings
        const pathThatTheFileIsDownloaded = data.pathThatTheFileIsDownloaded
        let nameFile = path.basename(pathThatTheFileIsDownloaded)
        if (settings.situationNotaFiscal === '2') {
            nameFile = nameFile.replace('.zip', '') + '_canc.zip'
        }

        logger.info('---------------------------------------------------')
        logger.info(`- [SaveXMLsInFolder] - Salvando xmls na pasta ${settings.codeCompanieAccountSystem || settings.federalRegistration} - ${settings.nameCompanie} periodo ${settings.dateStartDown} a ${settings.dateEndDown} modelo ${settings.modelNotaFiscal} e situacao ${settings.situationNotaFiscal}`)
        logger.info('---------------------------------------------------')

        settings.typeLog = 'success'
        const pathRoutineAutomactic = await createFolderToSaveData(settings, true)

        if (settings.codeCompanieAccountSystem && pathRoutineAutomactic) {
            await fsExtra.copy(pathThatTheFileIsDownloaded, path.resolve(pathRoutineAutomactic, nameFile))
        }
        return Promise.resolve()
    }
}