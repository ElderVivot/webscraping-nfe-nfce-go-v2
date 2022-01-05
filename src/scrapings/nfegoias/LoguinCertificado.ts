import { Page, Browser } from 'puppeteer'

import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function LoguinCertificado (page: Page, browser: Browser, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.goto('https://nfe.sefaz.go.gov.br/nfeweb/sites/nfe/consulta-publica', { waitUntil: 'networkidle2' })
        // await page.waitForSelector("a[href*='nfe.sefaz.go.gov'] > button")
        // await page.click("a[href*='nfe.sefaz.go.gov'] > button")
        await page.waitForSelector('#filtro')
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'LoguinCertificado'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao fazer loguin com o certificado.'
        console.log(`[Final] - ${settings.messageLogToShowUser}`)
        console.log('-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, browser)
        // dont save in database because dont have information necessary to reprocess
        await treatsMessageLog.saveLog(false)
    }
}