import path from 'path'

import { logger } from '@common/log'
import { ISettingsNFeGoias } from '@scrapings/_interfaces'

import { mainDeleteCertificates } from './delete-certificates'
import { installCertificate } from './install-certificates'
import { mainSetDefaultCertificateRegedit } from './set-default-certificate-regedit'

const { DELETE_CERTIFICATE_ALL_PROCESSING } = process.env

let deleteCertificateAllProcessing = false
if (DELETE_CERTIFICATE_ALL_PROCESSING && DELETE_CERTIFICATE_ALL_PROCESSING === '1') deleteCertificateAllProcessing = true

export async function prepareCertificateRegedit (fileCertificate: string, settings: ISettingsNFeGoias): Promise<void> {
    try {
        const nameFile = path.basename(fileCertificate)

        if (deleteCertificateAllProcessing) {
            logger.info('- Deletando certificados')
            await mainDeleteCertificates()
        }

        logger.info(`- Instalando certificado ${nameFile}`)
        await installCertificate(fileCertificate, settings.passwordCert)

        logger.info(`- Lendo certificado ${settings.commomNameCert}`)
        await mainSetDefaultCertificateRegedit('https://nfeweb.sefaz.go.gov.br', settings)
    } catch (error) {
        logger.error(error)
    }
}