
import fs from 'fs'

import { treateTextField, zeroLeft } from '@utils/functions'

import { ISettingsNFeGoias } from './_interfaces'

function typeNF (modelo: string): string {
    if (modelo === '55') return 'NF-e'
    else if (modelo === '57') return 'CT-e'
    else if (modelo === '65') return 'NFC-e'
    else return 'DESCONHECIDO'
}

function getDescriptionSituacaoNF (situacao: string): string {
    if (situacao === '1') return 'Autorizadas'
    else if (situacao === '2') return 'Canceladas'
    else return 'DESCONHECIDO'
}

const mountFolder = (settings: ISettingsNFeGoias, folder: string) => {
    let newFolder = folder
    if (folder.substring(0, 2) === '\\\\') {
        newFolder = folder.substring(0, 2) + folder.substring(2).replace(/[\\]/g, '/')
    } else {
        newFolder = folder.replace(/[\\]/g, '/')
    }

    const nameCompanie = settings.nameCompanie ? treateTextField(settings.nameCompanie).substring(0, 70) : undefined
    settings.typeNF = typeNF(settings.modelNotaFiscal)
    settings.situacaoNFDescription = getDescriptionSituacaoNF(settings.situationNotaFiscal)
    const monthString = zeroLeft(settings.month.toString(), 2)

    const folderSplit = newFolder.split('/')
    let folderComplete = ''
    for (const field of folderSplit) {
        if (field === 'typeLog') {
            folderComplete += settings.typeLog ? `${settings.typeLog}/` : ''
        } else if (field === 'nameCompanieWithCnpj') {
            folderComplete += settings.nameCompanie && settings.federalRegistration ? `${nameCompanie} - ${settings.federalRegistration}/` : ''
        } else if (field === 'cgce') {
            folderComplete += settings.federalRegistration ? `${settings.federalRegistration}/` : ''
        } else if (field === 'nameCompanieWithCodeCompanie') {
            folderComplete += settings.nameCompanie && settings.codeCompanieAccountSystem ? `${nameCompanie} - ${settings.codeCompanieAccountSystem}/` : `${nameCompanie} - ${settings.codeCompanieAccountSystem}/`
        } else if (field === 'year') {
            folderComplete += settings.year ? `${settings.year}/` : ''
        } else if (field === 'month') {
            folderComplete += settings.month ? `${monthString}/` : ''
        } else if (field === 'EntradasOrSaidas') {
            folderComplete += settings.entradasOrSaidas ? `${settings.entradasOrSaidas}/` : ''
        } else if (field === 'typeNF') {
            folderComplete += settings.typeNF ? `${settings.typeNF}/` : ''
        } else if (field === 'situacaoNF') {
            folderComplete += settings.situacaoNFDescription ? `${settings.situacaoNFDescription}/` : ''
        } else if (field === 'codeCompanieWithNameCompanie') {
            folderComplete += settings.nameCompanie && settings.codeCompanieAccountSystem ? `${settings.codeCompanieAccountSystem}-${nameCompanie}/` : `${nameCompanie} - ${settings.federalRegistration}/`
        } else if (field === 'codeCompanieRotinaAutomatica') {
            folderComplete += settings.codeCompanieAccountSystem ? `${settings.codeCompanieAccountSystem}-/` : ''
        } else if (field === 'monthYearRotinaAutomatica') {
            folderComplete += settings.year && settings.month ? `${monthString}${settings.year}/` : ''
        } else if (field === 'monthYear') {
            folderComplete += settings.year && settings.month ? `${monthString}-${settings.year}/` : ''
        } else if (field === 'yearMonth') {
            folderComplete += settings.year && settings.month ? `${settings.year}-${monthString}/` : ''
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
    let folder = ''

    if (settings.typeLog === 'success' || settings.typeLog === 'processing') {
        folder = mountFolder(settings, folderToSaveXMLs)
        if (folderRoutineAutomactic && settings.codeCompanieAccountSystem) {
            if (folderToSaveXMLsRotinaAutomatica) {
                folder = mountFolder(settings, folderToSaveXMLsRotinaAutomatica)
            } else {
                return ''
            }
        }
    }

    return folder
}