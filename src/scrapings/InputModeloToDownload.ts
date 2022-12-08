import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

function getSituationNF (situationNotaFiscal: string): string {
    if (situationNotaFiscal === '1') {
        return '2'
    } else if (situationNotaFiscal === '2') {
        return '3'
    }
}

export async function InputModeloToDownload (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        await page.waitForSelector('#cmpModelo')
        await page.select('#cmpModelo', settings.modelNotaFiscal)

        if (settings.situationNotaFiscal !== '0' && settings.situationNotaFiscal !== '1') {
            await page.waitForSelector('#cmpSituacao')
            await page.select('#cmpSituacao', getSituationNF(settings.situationNotaFiscal))
        }
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'InputModeloToDownload'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao selecionar modelo pra download das notas.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}