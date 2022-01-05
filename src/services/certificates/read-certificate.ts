import os from 'os'
import path from 'path'
import pem from 'pem'
import util from 'util'

interface ICertificateInfo extends pem.CertificateSubjectReadResult {
    validity: {
        start: number,
        end: number
    }
}

process.env.OPENSSL_CONF = path.join(__dirname, '..', '..', '..', 'vendor', 'openssl', 'shared', 'openssl.cnf')
// use bundled openssl executable
pem.config({
    pathOpenSSL: path.join(__dirname, '..', '..', '..', 'vendor', 'openssl', os.arch() === 'x64' ? 'x64' : 'ia32', 'openssl.exe')
})

const readPkcs12Async = util.promisify(
    (bufferOrPath: string | Buffer, options: pem.Pkcs12ReadOptions, cb: pem.Callback<pem.Pkcs12ReadResult>) => pem.readPkcs12(
        bufferOrPath, options, (err, result) => cb(err, result)
    )
)
const readCertificateInfoAsyn = util.promisify(
    (certificate: string, cb: pem.Callback<ICertificateInfo>) => pem.readCertificateInfo(
        certificate, (err, result: ICertificateInfo) => cb(err, result)
    )
)

export async function ReadCertificate (pathCertificate: string, password: string) : Promise<ICertificateInfo> {
    try {
        const certificate = await readPkcs12Async(pathCertificate, { p12Password: password })
        const certificateInfo = await readCertificateInfoAsyn(certificate.cert)
        return certificateInfo
    } catch (error) {
        return {
            country: '',
            state: '',
            locality: '',
            organization: '',
            organizationUnit: '',
            commonName: 'invalid_password',
            emailAddress: '',
            validity: {
                start: 0,
                end: 0
            }
        }
    }
}

// ReadCertificate('C:/certificados/bahrem_bar_19162372000142_senha_bahrem2021.pfx', 'bahrem2021').then(_ => console.log(_))

// pem.readPkcs12(wayPfx, { p12Password: 'soma123' }, (err, cert) => {
//     if (err) console.log(err)
//     pem.readCertificateInfo(cert.cert, (err, cert) => {
//         if (err) console.log(err)
//         return cert
//     })
// })