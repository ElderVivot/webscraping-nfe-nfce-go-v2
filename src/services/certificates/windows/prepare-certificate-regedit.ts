import path from 'path'

import { logger } from '@common/log'
import { ISettingsNFeGoias } from '@scrapings/_interfaces'
import { saveLogDynamo } from '@services/dynamodb'

import { mainDeleteCertificates } from './delete-certificates'
import { installCertificate } from './install-certificates'
import { mainSetDefaultCertificateRegedit } from './set-default-certificate-regedit'

export async function prepareCertificateRegedit (fileCertificate: string, settings: ISettingsNFeGoias): Promise<void> {
    try {
        const nameFile = path.basename(fileCertificate)

        logger.info('- Deletando certificados')
        await mainDeleteCertificates(false)

        logger.info(`- Instalando certificado ${nameFile}`)
        await installCertificate(fileCertificate, settings.passwordCert)

        logger.info(`- Lendo certificado ${settings.commomNameCert}`)
        await mainSetDefaultCertificateRegedit('https://nfe.sefaz.go.gov.br', settings)
    } catch (error) {
        logger.error(error)
        await saveLogDynamo({
            messageError: error,
            messageLog: 'PrepareCertificateRegedit',
            pathFile: __filename,
            typeLog: 'error'
        })
    }
}