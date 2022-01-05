import { format } from 'date-fns-tz'
import path from 'path'

import 'dotenv/config'
import { scrapingNotesFirstProcessing } from '../../queues/lib/ScrapingNotesFirstProcessing'
import { OrganizeCertificates } from '../../services/certificates/organize-certificates'
import { listFiles } from '../../utils/get-list-files-of-folder'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'

class Applicattion {
    private hourLog: string
    private hourLogToCreateFolder: string

    constructor () {
        this.hourLogToCreateFolder = format(new Date(), 'yyyy-MM-dd_hh-mm-ss_a', { timeZone: 'America/Sao_Paulo' })
        this.hourLog = format(new Date(), 'yyyy-MM-dd hh:mm:ss a', { timeZone: 'America/Sao_Paulo' })
    }

    async process (): Promise<void> {
        console.log('*- Organizando certificados')
        await OrganizeCertificates(process.env.FOLDER_CERTIFICATE_ORIGINAL, process.env.FOLDER_CERTIFICATE_COPY)

        const listFilesCertificates = await listFiles(path.resolve(process.env.FOLDER_CERTIFICATE_COPY, 'ok'))
        for (const fileCertificate of listFilesCertificates) {
            try {
                const settings: ISettingsNFeGoias = {
                    wayCertificate: fileCertificate,
                    hourLog: this.hourLog,
                    dateHourProcessing: this.hourLogToCreateFolder
                }
                await scrapingNotesFirstProcessing.add({
                    settings
                })
                console.log(`*- Certificado ${fileCertificate} adicionado na fila`)
            } catch (error) {
                console.log(`*- Erro ao adicionar na fila certificado ${fileCertificate}. O erro é ${error}`)
            }
        }
    }
}

// const applicattion = new Applicattion()
// applicattion.process().then(_ => console.log(_))

export default Applicattion