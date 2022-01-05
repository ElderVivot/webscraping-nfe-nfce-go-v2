// import { tmpdir } from 'os'
import 'dotenv/config'

import { ISettingsNFeGoias } from '../../scrapings/nfegoias/ISettingsNFeGoias'
import { MainNFGoias } from '../../scrapings/nfegoias/MainNFGoias'
import { prepareCertificateRegedit } from '../../services/certificates/windows/prepare-certificate-regedit'
// import { DeleteFolder } from '../../services/delete-folders'

const ScrapingNotes = {
    key: 'ScrapingNotes',
    async handle ({ data }): Promise<void> {
        const settings: ISettingsNFeGoias = data.settings
        const certificate = await prepareCertificateRegedit(settings.wayCertificate)

        await MainNFGoias({
            wayCertificate: settings.wayCertificate,
            hourLog: settings.hourLog,
            dateHourProcessing: settings.dateHourProcessing,
            nameCompanie: certificate.nameCertificate,
            id: settings.id,
            cgceCompanie: settings.cgceCompanie,
            modelNF: settings.modelNF,
            situacaoNF: settings.situacaoNF,
            typeLog: settings.typeLog,
            qtdTimesReprocessed: settings.qtdTimesReprocessed,
            dateStartDown: settings.dateStartDown,
            dateEndDown: settings.dateEndDown,
            pageInicial: settings.pageInicial,
            pageFinal: settings.pageFinal
        })

        // it's necessary to close chromiumm withoud error
        await new Promise((resolve) => setTimeout(() => resolve(''), 5000))

        // console.log('*- Deletando pastas com o nome puppeteer_dev_chrome do %temp% do user')
        // await DeleteFolder(tmpdir(), 'puppeteer_dev_chrome', true)
        return Promise.resolve()
    }
}

export { ScrapingNotes }