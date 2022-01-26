import { exec } from 'child_process'
import util from 'util'

import { IDateAdapter } from '@common/adapters/date/date-adapter'
import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { logger } from '@common/log'
import { treateTextFieldTwo as treatText } from '@utils/functions'

import { ICertifate } from '../i-certificate'

const execAsync = util.promisify(exec)

function clearDataCertificate (): ICertifate {
    return {
        numeroSerie: '',
        notBefore: null,
        notAfter: null,
        requerenteCN: '',
        requerenteOU: '',
        typeCgceCertificate: ''
    }
}

const certificates: Array<ICertifate> = []

function getDataCertificate (dateFactory: IDateAdapter, stdoutSplit: Array<string>): void {
    let certificate: ICertifate
    for (const line of stdoutSplit) {
        if (!line) continue
        const lineFormated = treatText(line)
        const lineTrim = line.trim()
        const lineTrimSplit = lineTrim.split(':')
        const fieldTwo = lineTrimSplit[1]?.trim()
        if (lineFormated.indexOf('==== CERTIFICADO') >= 0) {
            certificate = clearDataCertificate()
        } else if (lineFormated.indexOf('NMERO DE SRIE:') >= 0) {
            certificate.numeroSerie = fieldTwo
        } else if (lineFormated.indexOf('NOTBEFORE:') >= 0) {
            certificate.notBefore = dateFactory.parseDate(fieldTwo.substring(0, 10), 'dd/MM/yyyy')
        } else if (lineFormated.indexOf('NOTAFTER:') >= 0) {
            certificate.notAfter = dateFactory.parseDate(fieldTwo.substring(0, 10), 'dd/MM/yyyy')
        } else if (lineFormated.indexOf('REQUERENTE:') >= 0) {
            let requerenteOU = ''
            certificate.requerenteCN = lineTrim.split('CN=')[1].split(',')[0]
            const OUSplit = lineTrim.split('OU=')
            for (const value of OUSplit) {
                const valueUpperCase = value.toUpperCase()
                for (const textsPossible of ['PF', 'CPF', 'PJ', 'CNPJ']) {
                    if (valueUpperCase.indexOf(textsPossible) >= 0 && valueUpperCase.indexOf('REQUERENTE') === -1) {
                        requerenteOU = valueUpperCase
                        break
                    }
                }
                if (requerenteOU) break
            }
            certificate.requerenteOU = requerenteOU || lineTrim.split('OU=')[1].split(',')[0]
            certificate.typeCgceCertificate = 'CNPJ'
            if (certificate.requerenteOU.indexOf('PF') >= 0 || certificate.requerenteOU.indexOf('CPF') >= 0) {
                certificate.typeCgceCertificate = 'CPF'
            }
            certificates.push(certificate)
        }
    }
}

export async function mainGetCertificates (): Promise<ICertifate[]> {
    const dateFactory = makeDateImplementation()

    certificates.splice(0, certificates.length)
    const { stdout, stderr } = await execAsync('certutil -store -user My')
    let stdoutSplit: Array<string>
    if (stdout) {
        stdoutSplit = stdout.split('\r\n')
        getDataCertificate(dateFactory, stdoutSplit)
    }
    if (stderr) {
        logger.error({
            msg: '- Erro ao ler certificados instalados em Usuario/Pessoal: ',
            locationFile: __filename,
            error: stderr
        })
    }
    return certificates
}
// mainGetCertificates().then(_ => console.log(_))