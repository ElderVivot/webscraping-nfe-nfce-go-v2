import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import util from 'util'

import { logger } from '@common/log'
// import { listFiles } from '@utils/get-list-files-of-folder'

const execAsync = util.promisify(exec)

export async function installCertificate (fileCertificate: string, password: string): Promise<void> {
    try {
        const pathInstallCertificate = path.resolve(__dirname, 'install-certificate.ps1')

        const textCommand = `certutil -f -user -p ${password} -importPFX My "${fileCertificate}"`

        fs.writeFile(
            pathInstallCertificate,
            textCommand,
            error => {
                if (error) console.log(error)
            }
        )
        await execAsync(`powershell -Command "Start-Process powershell -ArgumentList '-noprofile -file ${pathInstallCertificate}' -Verb RunAs`)
        // it's necessary to set certificate regedit, only await in line acima don't suficient
        await new Promise((resolve) => setTimeout(() => resolve(''), 2000))
    } catch (error) {
        logger.error(error)
    }
}

// export async function installCertificates (directory: string): Promise<void> {
//     const listFilesCertificates = await listFiles(directory)
//     for (const fileCertificate of listFilesCertificates) {
//         await installCertificate(fileCertificate)
//     }
// }
// installCertificates('C:/_temp/certificados/teste/ok').then(_ => console.log(_))