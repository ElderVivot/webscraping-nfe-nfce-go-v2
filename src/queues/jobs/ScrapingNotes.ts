import path from 'path'

import { makeDownloadImplementation } from '@common/adapters/download/download-factory'
import { ISettingsNFeGoias } from '@scrapings/_interfaces'
import { MainNFGoias } from '@scrapings/MainNFGoiasProcessTheQueue'
import { prepareCertificateRegedit } from '@services/certificates/windows/prepare-certificate-regedit'

const ScrapingNotesJob = {
    key: 'ScrapingNotes',
    async handle ({ data }): Promise<void> {
        const settings: ISettingsNFeGoias = data.settings

        const downloadImplementation = makeDownloadImplementation({
            url: settings.wayCertificate,
            directory: './certificados/',
            skipExistingFileName: true
        })
        await downloadImplementation.download()

        const nameCertificateSplit = settings.wayCertificate.split('/')
        await prepareCertificateRegedit(path.resolve('./certificados/', nameCertificateSplit[nameCertificateSplit.length - 1]), settings)

        await MainNFGoias({
            ...settings
        })

        // it's necessary to close chromiumm withoud error
        await new Promise((resolve) => setTimeout(() => resolve(''), 5000))

        return Promise.resolve()
    }
}

export { ScrapingNotesJob }