import path from 'path'

import { logger } from '@common/log'

import { ICertifate } from '../i-certificate'
import { mainDeleteCertificates } from './delete-certificates'
import { mainGetCertificates } from './get-all-certificates-user-my'
import { installCertificate } from './install-certificates'
import { mainSetDefaultCertificateRegedit } from './set-default-certificate-regedit'

export async function prepareCertificateRegedit (fileCertificate: string): Promise<ICertifate> {
    try {
        const nameFile = path.basename(fileCertificate).split('-')[0]

        logger.info('- Deletando certificados')
        await mainDeleteCertificates(false)

        logger.info(`- Instalando certificado ${nameFile}`)
        await installCertificate(fileCertificate)

        const certificates = await mainGetCertificates()
        const certificate = certificates[0]
        if (certificate.typeCgceCertificate === 'CPF') {
            logger.info(`- Certificado ${certificate.requerenteCN} é um CPF, parando processamento.`)
            throw 'CERTIFICATE_CPF'
        }

        const nameCertificate = certificate.requerenteCN.split(':')[0]
        logger.info(`- Lendo certificado ${certificate.requerenteCN}`)
        await mainSetDefaultCertificateRegedit('https://nfe.sefaz.go.gov.br', certificate)

        certificate.nameCertificate = nameCertificate
        return certificate
    } catch (error) {
        if (error !== 'CERTIFICATE_CPF') {
            logger.error({
                msg: `- Erro ao processar certificado ${fileCertificate}`,
                locationFile: __filename,
                error
            })
        }
    }
}