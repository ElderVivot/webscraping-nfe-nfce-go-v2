import { exec } from 'child_process'
import util from 'util'

import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { logger } from '@common/log'

import { ICertifate } from '../i-certificate'
import { mainGetCertificates } from './get-all-certificates-user-my'

const execAsync = util.promisify(exec)

const checkIfCertificateIsExpired = (certificate: ICertifate): boolean => {
    const dateFactory = makeDateImplementation()
    const today = dateFactory.zonedTimeToUtc(new Date(), 'America/Sao_Paulo')
    if (today > certificate.notAfter) {
        return true
    }
    return false
}

export async function mainDeleteCertificates (deleteOnlyExpired = true): Promise<void> {
    const certificates = await mainGetCertificates()

    for (const certificate of certificates) {
        try {
            if (checkIfCertificateIsExpired(certificate) || !deleteOnlyExpired) {
                const { stdout, stderr } = await execAsync(`certutil -delstore -user My ${certificate.numeroSerie}`)
                if (stdout) {
                    logger.info(`- Certificado ${certificate.requerenteCN} deletado com sucesso`)
                }
                if (stderr) {
                    logger.error(stderr)
                }
            }
        } catch (error) {
            logger.error(error)
        }
    }
}
// mainDeleteCertificates().then(_ => console.log(_))