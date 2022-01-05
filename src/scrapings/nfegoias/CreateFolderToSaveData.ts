
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

// import GetSettingsWayFiles from '../controllers/GetSettingsWayFiles'
import { treateTextField } from '../../utils/functions'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'

const mountFolder = (settings: ISettingsNFeGoias, folder: string) => {
    let newFolder = folder
    if (folder.substring(0, 2) === '\\\\') {
        newFolder = folder.substring(0, 2) + folder.substring(2).replace(/[\\]/g, '/')
    } else {
        newFolder = folder.replace(/[\\]/g, '/')
    }

    const nameCompanie = settings.nameCompanie ? treateTextField(settings.nameCompanie).substring(0, 70) : undefined
    // const nameCompanie = settings.companie ? settings.companie.substring(0, 70) : undefined

    const folderSplit = newFolder.split('/')
    let folderComplete = ''
    for (const field of folderSplit) {
        if (field === 'hourLog') {
            folderComplete += settings.dateHourProcessing ? `${settings.dateHourProcessing}/` : ''
        } else if (field === 'numeroSerie') {
            folderComplete += settings.numeroSerie ? `${settings.numeroSerie}/` : ''
        } else if (field === 'typeLog') {
            folderComplete += settings.typeLog ? `${settings.typeLog}/` : ''
        } else if (field === 'nameCompanieWithCnpj') {
            folderComplete += settings.nameCompanie && settings.cgceCompanie ? `${nameCompanie} - ${settings.cgceCompanie}/` : ''
        } else if (field === 'cgce') {
            folderComplete += settings.cgceCompanie ? `${settings.cgceCompanie}/` : ''
        } else if (field === 'nameCompanieWithCodeCompanie') {
            folderComplete += settings.nameCompanie && settings.codeCompanie ? `${nameCompanie} - ${settings.codeCompanie}/` : `${nameCompanie} - ${settings.cgceCompanie}/`
        } else if (field === 'year') {
            folderComplete += settings.year ? `${settings.year}/` : ''
        } else if (field === 'month') {
            folderComplete += settings.month ? `${settings.month}/` : ''
        } else if (field === 'EntradasOrSaidas') {
            folderComplete += settings.entradasOrSaidas ? `${settings.entradasOrSaidas}/` : ''
        } else if (field === 'typeNF') {
            folderComplete += settings.typeNF ? `${settings.typeNF}/` : ''
        } else if (field === 'situacaoNF') {
            folderComplete += settings.situacaoNFDescription ? `${settings.situacaoNFDescription}/` : ''
        } else if (field === 'codeCompanieWithNameCompanie') {
            folderComplete += settings.nameCompanie && settings.codeCompanie ? `${settings.codeCompanie}-${nameCompanie}/` : `${nameCompanie} - ${settings.cgceCompanie}/`
        } else if (field === 'codeCompanieRotinaAutomatica') {
            folderComplete += settings.codeCompanie ? `${settings.codeCompanie}-/` : ''
        } else if (field === 'monthYearRotinaAutomatica') {
            folderComplete += settings.year && settings.month ? `${settings.month}${settings.year}/` : ''
        } else if (field === 'monthYear') {
            folderComplete += settings.year && settings.month ? `${settings.month}-${settings.year}/` : ''
        } else if (field === 'yearMonth') {
            folderComplete += settings.year && settings.month ? `${settings.year}-${settings.month}/` : ''
        } else {
            folderComplete += `${field}/`
        }
        fs.existsSync(folderComplete) || fs.mkdirSync(folderComplete)
    }
    return folderComplete
}

export async function createFolderToSaveData (settings: ISettingsNFeGoias, folderRoutineAutomactic = false): Promise<string> {
    const folderToSaveXMLs = process.env.FOLDER_TO_SAVE_XMLs
    const folderToSaveXMLsRotinaAutomatica = process.env.FOLDER_TO_SAVE_XMLs_ROT_AUT
    const folderToSaveLog = path.resolve(__dirname, '..', '..', 'logs', 'goias', 'hourLog', 'numeroSerie', 'typeLog', 'nameCompanieWithCnpj', 'yearMonth')
    let folder = ''

    if (settings.typeLog === 'success' || settings.typeLog === 'processing') {
        folder = mountFolder(settings, folderToSaveXMLs)
        if (folderRoutineAutomactic && settings.codeCompanie) {
            if (folderToSaveXMLsRotinaAutomatica) {
                folder = mountFolder(settings, folderToSaveXMLsRotinaAutomatica)
            } else {
                return ''
            }
        }
    } else if (settings.typeLog === 'error' || settings.typeLog === 'warning') {
        folder = mountFolder(settings, folderToSaveLog)
    }

    return folder
}