import { exec } from 'child_process'
import util from 'util'

import { logger } from '@common/log'
import { todayLocale } from '@utils/treat-date'

import { ICertifate } from '../i-certificate'
import { mainGetCertificates } from './get-all-certificates-user-my'

const execAsync = util.promisify(exec)

const checkIfCertificateIsExpired = (certificate: ICertifate): boolean => {
    const today = todayLocale()
    if (today > certificate.notAfter) {
        return true
    }
    return false
}

export async function mainDeleteCertificates (deleteOnlyExpired = true): Promise<void> {
    const certificates = await mainGetCertificates()

    for (const certificate of certificates) {
        if (checkIfCertificateIsExpired(certificate) || !deleteOnlyExpired) {
            const { stdout, stderr } = await execAsync(`certutil -delstore -user My ${certificate.numeroSerie}`)
            if (stdout) {
                logger.info(`- Certificado ${certificate.requerenteCN} deletado com sucesso`)
            }
            if (stderr) {
                logger.error({
                    msg: '- Erro ao deletar certificado: ',
                    locationFile: __filename,
                    error: stderr
                })
            }
        }
    }
}
// mainDeleteCertificates().then(_ => console.log(_))