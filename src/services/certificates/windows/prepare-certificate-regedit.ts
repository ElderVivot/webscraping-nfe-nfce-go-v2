import path from 'path'

import { ICertifate } from '../i-certificate'
import { mainDeleteCertificates } from './delete-certificates'
import { mainGetCertificates } from './get-all-certificates-user-my'
import { installCertificate } from './install-certificates'
import { mainSetDefaultCertificateRegedit } from './set-default-certificate-regedit'

export async function prepareCertificateRegedit (fileCertificate: string): Promise<ICertifate> {
    try {
        const nameFile = path.basename(fileCertificate).split('-')[0]

        console.log('\n*- Deletando certificados')
        await mainDeleteCertificates(false)

        console.log(`\n*- Instalando certificado ${nameFile}`)
        await installCertificate(fileCertificate)

        const certificates = await mainGetCertificates()
        const certificate = certificates[0]
        if (certificate.typeCgceCertificate === 'CPF') {
            console.log(`- Certificado ${certificate.requerenteCN} é um CPF, parando processamento.`)
            console.log('------------------------------------------')
            throw 'CERTIFICATE_CPF'
        }

        const nameCertificate = certificate.requerenteCN.split(':')[0]
        console.log(`\n*- Lendo certificado ${certificate.requerenteCN}`)
        await mainSetDefaultCertificateRegedit('https://nfe.sefaz.go.gov.br', certificate)

        certificate.nameCertificate = nameCertificate
        return certificate
    } catch (error) {
        if (error !== 'CERTIFICATE_CPF') {
            console.log(`*- Erro ao processar certificado ${fileCertificate}. O erro é ${error}`)
        }
    }
}