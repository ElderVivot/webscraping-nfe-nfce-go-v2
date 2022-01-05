import { exec } from 'child_process'
import util from 'util'

import { todayLocale } from '../../../utils/treat-date'
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
                console.log(`- Certificado ${certificate.requerenteCN} deletado com sucesso`)
            }
            if (stderr) {
                console.log('- Erro ao deletar certificado: ', stderr)
            }
        }
    }
}
// mainDeleteCertificates().then(_ => console.log(_))