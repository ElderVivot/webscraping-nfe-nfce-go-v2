import fsExtra from 'fs-extra'
import path from 'path'
import extractZip from 'extract-zip'

import { logger } from '@common/log'
import { ISettingsNFeGoias } from '@scrapings/_interfaces'
import { createFolderToSaveData } from '@scrapings/CreateFolderToSaveData'

export const SaveXMLsNFeNFCGOJob = {
    key: 'SaveXMLsNFeNFCGO',
    async handle ({ data }): Promise<void> {
        try {
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
                const pathZip = path.resolve(pathRoutineAutomactic, nameFile)
                await fsExtra.copy(pathThatTheFileIsDownloaded, pathZip)
                await extractZip(pathZip, {dir: pathRoutineAutomactic})
            }
            return Promise.resolve()
        } catch (error) {
            logger.error(error, __filename)
            return Promise.resolve()
        }
    }
}