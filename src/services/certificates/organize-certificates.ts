import { promises as fs } from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'

import { listFiles } from '../../utils/get-list-files-of-folder'
import { ReadCertificate } from './read-certificate'

const getPasswordOfNameFile = (file: string, passwordDefault: string): string => {
    try {
        const extensionFile = path.extname(file)
        const fileUpperCase = file.toUpperCase()
        const positionPassword = fileUpperCase.indexOf(passwordDefault)
        const textWithPassword = file.substring(positionPassword + passwordDefault.length, file.length).trim()
        const textWithPasswordSplit = textWithPassword.split(' ')
        const password = textWithPasswordSplit[0].replace(extensionFile, '')
        return password
    } catch (error) {
        console.log(error)
        return ''
    }
}

const identifiesPasswordDefault = (word: string, file: string): string => {
    let password = ''
    const wordUpperCase = word.toUpperCase()
    const passwordDefaults = ['SENHA=', 'SENHA-', 'SENHA -', 'SENHA =', 'SENHA']
    for (const passwordDefault of passwordDefaults) {
        const positionPasswordDefault = wordUpperCase.indexOf(passwordDefault)
        if (positionPasswordDefault >= 0) {
            password = getPasswordOfNameFile(file, passwordDefault)
            break
        }
    }
    return password
}

export async function OrganizeCertificates (directory: string, directoryToCopy: string): Promise<void> {
    try {
        await fs.rmdir(directoryToCopy, { recursive: true })
        console.log('- Directory with certificates deleted.')
    } catch (error) {
        console.log('- Error delete directory with certificate.')
    }
    fsExtra.mkdirSync(directoryToCopy)
    const files = await listFiles(directory)
    for (const file of files) {
        const extensionFile = path.extname(file)
        if (extensionFile !== '.pfx' && extensionFile !== '.p12') continue
        const nameFileOriginal = path.basename(file)
        const fileUpperCase = file.toUpperCase()
        if (fileUpperCase.indexOf('SENHA') >= 0) {
            const fileSplitSpace = file.split(' ')
            let identifiedPasswordPattern = false
            for (let idx = 0; idx < fileSplitSpace.length; idx++) {
                const word = fileSplitSpace[idx]
                const password = identifiesPasswordDefault(word, file)
                if (password) {
                    identifiedPasswordPattern = true
                    const certificateInfo = await ReadCertificate(file, password)
                    if (certificateInfo.commonName === 'invalid_password') {
                        await fsExtra.copy(file, path.resolve(directoryToCopy, 'senha_invalida', `${nameFileOriginal}`), { overwrite: true })
                        break
                    }
                    if (new Date() > new Date(certificateInfo.validity.end)) {
                        await fsExtra.copy(file, path.resolve(directoryToCopy, 'vencido', `${nameFileOriginal}`), { overwrite: true })
                        break
                    }
                    const commonName = certificateInfo.commonName.trim().normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z ])/g, '').toUpperCase().substring(0, 70)
                    const nameFile = `${commonName}-${password}${extensionFile}`
                    await fsExtra.copy(file, path.resolve(directoryToCopy, 'ok', nameFile), { overwrite: true })
                    break
                }
            }
            if (!identifiedPasswordPattern) {
                await fsExtra.copy(file, path.resolve(directoryToCopy, 'padrao_senha_nao_reconhecido', `${nameFileOriginal}`), { overwrite: true })
            }
        } else {
            await fsExtra.copy(file, path.resolve(directoryToCopy, 'sem_senha', `${nameFileOriginal}`), { overwrite: true })
        }
    }
}

// OrganizeCertificates('C:/_temp/certificados/analisar', 'C:/_temp/certificados/teste').then(_ => console.log(_))