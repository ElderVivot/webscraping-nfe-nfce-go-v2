import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function InputModeloToDownload (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForSelector('#cmpModelo')
        await page.select('#cmpModelo', settings.modelNF)

        await page.waitForSelector('#cmpSituacao')
        await page.select('#cmpSituacao', settings.situacaoNF)
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'InputModeloToDownload'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao selecionar modelo pra download das notas.'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}