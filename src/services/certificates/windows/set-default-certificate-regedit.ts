import { exec } from 'child_process'
import fs from 'fs'
// import Shell from 'node-powershell'
import path from 'path'
import util from 'util'

import { ICertifate } from '../i-certificate'

const execAsync = util.promisify(exec)

export async function mainSetDefaultCertificateRegedit (url: string, certificade: ICertifate): Promise<void> {
    const pathSetDefaultCertificateRegedit = path.resolve(__dirname, 'set-default-certificate-regedit.ps1')
    const textCommand = `New-Item -Path HKLM:\\SOFTWARE\\Policies\\Chromium -Name AutoSelectCertificateForUrls -Force
Set-Itemproperty -Path HKLM:\\SOFTWARE\\Policies\\Chromium\\AutoSelectCertificateForUrls -Name 1 -Value '{"pattern":"${url}","filter":{"SUBJECT":{"CN":"${certificade.requerenteCN.replace("'", "''")}"}}}'
exit`

    fs.writeFile(
        pathSetDefaultCertificateRegedit,
        textCommand,
        error => {
            if (error) console.log(error)
        }
    )
    await execAsync(`powershell -Command "Start-Process powershell -ArgumentList '-noprofile -file ${pathSetDefaultCertificateRegedit}' -Verb RunAs`)
    // it's necessary to set certificate regedit, only await in line acima don't suficient
    await new Promise((resolve) => setTimeout(() => resolve(''), 3000))
}

// mainSetDefaultCertificateRegedit('https://nfe.sefaz.go.gov.br', {
//     notAfter: new Date(),
//     notBefore: new Date(),
//     numeroSerie: '',
//     requerenteCN: 'A L R ELETRICA EIRELI:18040800000100',
//     requerenteOU: 'Certificado PJ A1'
// }).then(_ => console.log(_))