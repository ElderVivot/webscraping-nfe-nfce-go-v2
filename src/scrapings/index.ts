import path from 'path'
import 'dotenv/config'

import { logger } from '@common/log'
import { scrapingNotesFirstProcessing } from '@queues/lib/ScrapingNotesFirstProcessing'
import { OrganizeCertificates } from '@services/certificates/organize-certificates'
import { listFiles } from '@utils/get-list-files-of-folder'

import { ISettingsNFeGoias } from './_ISettingsNFeGoias'

class Applicattion {
    async process (): Promise<void> {
        logger.info('- Organizando certificados')
        await OrganizeCertificates(process.env.FOLDER_CERTIFICATE_ORIGINAL, process.env.FOLDER_CERTIFICATE_COPY)

        const listFilesCertificates = await listFiles(path.resolve(process.env.FOLDER_CERTIFICATE_COPY, 'ok'))
        for (const fileCertificate of listFilesCertificates) {
            try {
                const settings: ISettingsNFeGoias = {
                    wayCertificate: fileCertificate
                }
                await scrapingNotesFirstProcessing.add({
                    settings
                })
                logger.info({ msg: `-- Certificado ${fileCertificate} adicionado na fila` })
            } catch (error) {
                logger.error({
                    msg: `-- Erro ao adicionar na fila certificado ${fileCertificate}`,
                    locationFile: __filename,
                    error
                })
            }
            logger.info('------------------------------------------')
        }
    }
}

const applicattion = new Applicattion()
applicattion.process().then(_ => console.log(_))

export default Applicattion