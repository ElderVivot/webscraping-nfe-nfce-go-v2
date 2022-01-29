import { Page } from 'puppeteer'

import { makeDateImplementation } from '@common/adapters/date/date-factory'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function InputPeriodToDownload (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        const dateFactory = makeDateImplementation()

        const dateStartDown = dateFactory.formatDate(settings.dateStartDown, 'dd/MM/yyyy')
        const dateEndDown = dateFactory.formatDate(settings.dateEndDown, 'dd/MM/yyyy')
        await page.waitForSelector('#cmpDataInicial')
        await page.evaluate(`document.getElementById("cmpDataInicial").value="${dateStartDown}";`)
        await page.evaluate(`document.getElementById("cmpDataFinal").value="${dateEndDown}";`)
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'InputPeriodToDownload'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao informar o período pra download das notas.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}