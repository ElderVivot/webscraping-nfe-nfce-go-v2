/* eslint-disable camelcase */
import extractZip from 'extract-zip'
import fsExtra from 'fs-extra'
import path from 'path'
import 'dotenv/config'

import { logger } from '@common/log'
import { ISettingsNFeGoias } from '@scrapings/_interfaces'
import { createFolderToSaveData } from '@scrapings/CreateFolderToSaveData'

const FOLDER_TO_SAVE_XMLs = process.env.FOLDER_TO_SAVE_XMLs || ''

export const SaveXMLsNFeNFCGOJob = {
    key: 'SaveXMLsNFeNFCGO',
    async handle ({ data }: {data: {settings: ISettingsNFeGoias, pathThatTheFileIsDownloaded: string}}): Promise<void> {
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
                if (settings.situationNotaFiscal === '2') {
                    await extractZip(pathZip, { dir: pathRoutineAutomactic })
                }
            }
            if (settings.codeCompanieAccountSystem && !pathRoutineAutomactic && FOLDER_TO_SAVE_XMLs.indexOf('codeCompanieRotinaAutomatica') > 0) {
                const pathZip = path.resolve(pathThatTheFileIsDownloaded, nameFile.replace('.zip', ''))
                if (settings.situationNotaFiscal === '2') {
                    await extractZip(pathZip, { dir: pathThatTheFileIsDownloaded })
                }
            }
            return Promise.resolve()
        } catch (error) {
            logger.error(error, __filename)
            return Promise.resolve()
        }
    }
}