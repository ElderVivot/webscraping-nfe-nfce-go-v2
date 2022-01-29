import { ISettingsNFeGoias } from '@scrapings/_interfaces'
import { MainNFGoias } from '@scrapings/MainNFGoiasProcessTheQueue'
import { prepareCertificateRegedit } from '@services/certificates/windows/prepare-certificate-regedit'

const ScrapingNotesJob = {
    key: 'ScrapingNotes',
    async handle ({ data }): Promise<void> {
        const settings: ISettingsNFeGoias = data.settings
        const certificate = await prepareCertificateRegedit(settings.wayCertificate)

        await MainNFGoias({
            wayCertificate: settings.wayCertificate,
            nameCompanie: certificate.nameCertificate,
            idLogNotaFiscal: settings.idLogNotaFiscal,
            federalRegistration: settings.federalRegistration,
            modelNotaFiscal: settings.modelNotaFiscal,
            situationNotaFiscal: settings.situationNotaFiscal,
            typeLog: settings.typeLog,
            qtdTimesReprocessed: settings.qtdTimesReprocessed,
            dateStartDown: settings.dateStartDown,
            dateEndDown: settings.dateEndDown,
            pageInicial: settings.pageInicial,
            pageFinal: settings.pageFinal
        })

        // it's necessary to close chromiumm withoud error
        await new Promise((resolve) => setTimeout(() => resolve(''), 5000))

        return Promise.resolve()
    }
}

export { ScrapingNotesJob }