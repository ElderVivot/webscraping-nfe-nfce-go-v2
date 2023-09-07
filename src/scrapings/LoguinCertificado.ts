import { Page, Browser } from 'playwright'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function LoguinCertificado (page: Page, browser: Browser, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.goto('https://nfeweb.sefaz.go.gov.br/nfeweb/sites/nfe/consulta-publica', { waitUntil: 'networkidle', timeout: 90000 })
        await page.waitForSelector('#filtro')
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'LoguinCertificado'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao fazer loguin com o certificado.'
        settings.pathFile = __filename

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, browser)
        await treatsMessageLog.saveLog(true)
    }
}