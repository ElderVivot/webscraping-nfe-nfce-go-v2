import { ISettingsNFeGoias } from '@scrapings/_interfaces'
import { MainNFGoiasAddQueueToProcess } from '@scrapings/MainNFGoiasAddQueueToProcess'
import { prepareCertificateRegedit } from '@services/certificates/windows/prepare-certificate-regedit'

export const ScrapingNotesFirstProcessingJob = {
    key: 'ScrapingNotesFirstProcessing',
    async handle ({ data }): Promise<void> {
        const settings: ISettingsNFeGoias = data.settings
        const certificate = await prepareCertificateRegedit(settings.wayCertificate)

        await MainNFGoiasAddQueueToProcess({
            wayCertificate: settings.wayCertificate,
            nameCompanie: certificate.nameCertificate
        })
        await new Promise((resolve) => setTimeout(() => resolve(''), 1000))
        return Promise.resolve()
    }
}