import { Browser, Page } from 'playwright'

import { IFetchAdapter } from '@common/adapters/fetch/fetch-adapter'
import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'

import { ILogNotaFiscalApi, ISettingsNFeGoias } from './_interfaces'
import { urlBaseApi } from './_urlBaseApi'

export class TreatsMessageLogNFeGoias {
    private page: Page
    private browser: Browser | undefined
    private settings: ISettingsNFeGoias
    private noClosePage: boolean
    private fetchFactory: IFetchAdapter

    constructor (page: Page, settings: ISettingsNFeGoias, browser?: Browser, noClosePage?: boolean) {
        this.page = page
        this.browser = browser
        this.settings = settings
        this.noClosePage = noClosePage
        this.fetchFactory = makeFetchImplementation()
    }

    async saveLog (saveInDB = true): Promise<void> {
        if (saveInDB) {
            if (this.settings.typeLog === 'error') { this.settings.qtdTimesReprocessed += 1 }

            const dataToSave: ILogNotaFiscalApi = {
                idLogNotaFiscal: this.settings.idLogNotaFiscal,
                wayCertificate: this.settings.wayCertificate,
                typeLog: this.settings.typeLog || 'error',
                messageLog: this.settings.messageLog || '',
                messageError: this.settings.messageError?.toString() || this.settings.messageError || '',
                messageLogToShowUser: this.settings.messageLogToShowUser || '',
                federalRegistration: this.settings.federalRegistration,
                modelNotaFiscal: this.settings.modelNotaFiscal,
                situationNotaFiscal: this.settings.situationNotaFiscal,
                dateStartDown: this.settings.dateStartDown.toISOString(),
                dateEndDown: this.settings.dateEndDown.toISOString(),
                qtdNotesDown: this.settings.qtdNotes || 0,
                qtdTimesReprocessed: this.settings.qtdTimesReprocessed || 0,
                pageInicial: this.settings.pageInicial || 0,
                pageFinal: this.settings.pageFinal || 0,
                qtdPagesTotal: this.settings.qtdPagesTotal || 0
            }

            const urlBase = `${urlBaseApi}/log_nota_fiscal`
            try {
                if (this.settings.idLogNotaFiscal) {
                    const response = await this.fetchFactory.put<ILogNotaFiscalApi[]>(
                        `${urlBase}/${this.settings.idLogNotaFiscal}`,
                        { ...dataToSave },
                        { headers: { tenant: process.env.TENANT } }
                    )
                    if (response.status >= 400) throw response

                    // if (this.page) {
                    //     const screenshot = await this.page.screenshot({ type: 'png', fullPage: true })

                    //     await this.fetchFactory.patch<ILogNotaFiscalApi[]>(
                    //         `${urlBase}/${this.settings.idLogNotaFiscal}/upload_print_log`,
                    //         {
                    //             bufferImage: screenshot
                    //         },
                    //         { headers: { tenant: process.env.TENANT } }
                    //     )
                    // }
                } else {
                    const response = await this.fetchFactory.post<ILogNotaFiscalApi[]>(
                        `${urlBase}`,
                        { ...dataToSave },
                        { headers: { tenant: process.env.TENANT } }
                    )
                    if (response.status >= 400) throw response
                }
            } catch (error) {
                const responseAxios = handlesFetchError(error)
                if (responseAxios) this.settings.errorResponseApi = responseAxios
            }
        }

        if (this.settings.typeLog === 'error') {
            logger.error({
                ...this.settings
            })
        }

        if (!this.noClosePage && this.page) await this.page.close()
        if (this.browser) await this.browser.close()

        throw `TreatsMessageLog-[${this.settings.typeLog}]-${this.settings.messageLog}-${this.settings.messageError}`
    }
}