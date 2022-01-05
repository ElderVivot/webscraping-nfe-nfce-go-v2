// import path from 'path'
import { Browser, Page } from 'puppeteer'

import SaveLogNfeNfceGO from '../../controllers/SaveLogNfeNfceGO'
// import createFolderToSaveData from '../../utils/CreateFolderToSaveData'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'

export class TreatsMessageLogNFeGoias {
    private page: Page
    private browser: Browser | undefined
    private settings: ISettingsNFeGoias
    private noClosePage: boolean
    // private pathImg = ''

    constructor (page: Page, settings: ISettingsNFeGoias, browser?: Browser, noClosePage?: boolean) {
        this.page = page
        this.browser = browser
        this.settings = settings
        this.noClosePage = noClosePage
    }

    async saveLog (saveInDB = true): Promise<void> {
        // this.pathImg = await createFolderToSaveData(this.settings)
        // this.pathImg = path.resolve(this.pathImg, `${this.settings.messageLog}.png`)
        // await this.page.screenshot({ path: this.pathImg, fullPage: true })
        if (!this.noClosePage) await this.page.close()
        if (this.browser) await this.browser.close()

        if (saveInDB) {
            if (this.settings.typeLog === 'error') { this.settings.qtdTimesReprocessed += 1 }

            const saveLogNfeNfceGO = new SaveLogNfeNfceGO()
            await saveLogNfeNfceGO.saveLog({
                id: this.settings.id,
                wayCertificate: this.settings.wayCertificate,
                hourLog: this.settings.hourLog,
                typeLog: this.settings.typeLog || 'error',
                messageLog: this.settings.messageLog || '',
                messageError: this.settings.messageError?.toString() || this.settings.messageError,
                messageLogToShowUser: this.settings.messageLogToShowUser,
                urlImageDown: '',
                codeCompanie: this.settings.codeCompanie,
                nameCompanie: this.settings.nameCompanie,
                cgceCompanie: this.settings.cgceCompanie,
                modelNF: this.settings.modelNF || '',
                situacaoNF: this.settings.situacaoNF,
                dateStartDown: this.settings.dateStartDown,
                dateEndDown: this.settings.dateEndDown,
                qtdNotesDown: this.settings.qtdNotes,
                qtdTimesReprocessed: this.settings.qtdTimesReprocessed || 0,
                qtdPagesTotal: this.settings.qtdPagesTotal,
                pageInicial: this.settings.pageInicial,
                pageFinal: this.settings.pageFinal
            })
        }

        throw `[${this.settings.typeLog}]-${this.settings.messageLog}-${this.settings.messageError}`
    }
}