import fsExtra from 'fs-extra'
import path from 'path'

import { createFolderToSaveData } from '../../scrapings/nfegoias/CreateFolderToSaveData'
import { ISettingsNFeGoias } from '../../scrapings/nfegoias/ISettingsNFeGoias'

const SaveXMLsNFeNFCGO = {
    key: 'SaveXMLsNFeNFCGO',
    async handle ({ data }): Promise<void> {
        const settings: ISettingsNFeGoias = data.settings
        const pathThatTheFileIsDownloaded = data.pathThatTheFileIsDownloaded
        let nameFile = path.basename(pathThatTheFileIsDownloaded)
        if (settings.situacaoNF === '3') {
            nameFile = nameFile.replace('.zip', '') + '_canc.zip'
        }

        console.log('---------------------------------------------------')
        console.log(`- [SaveXMLsInFolder] - Salvando xmls na pasta ${settings.codeCompanie || settings.cgceCompanie} - ${settings.nameCompanie} periodo ${settings.dateStartDown} a ${settings.dateEndDown} modelo ${settings.typeNF} e situacao ${settings.situacaoNFDescription}`)
        console.log('---------------------------------------------------')

        settings.typeLog = 'success'
        const pathRoutineAutomactic = await createFolderToSaveData(settings, true)

        if (settings.codeCompanie && pathRoutineAutomactic) {
            await fsExtra.copy(pathThatTheFileIsDownloaded, path.resolve(pathRoutineAutomactic, nameFile))
        }
        return Promise.resolve()
    }
}

export default SaveXMLsNFeNFCGO