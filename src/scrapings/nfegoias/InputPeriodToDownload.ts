import { format, zonedTimeToUtc } from 'date-fns-tz'
import { Page } from 'puppeteer'

import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function InputPeriodToDownload (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        const dateStartDown = format(new Date(zonedTimeToUtc(settings.dateStartDown, 'America/Sao_Paulo')), 'dd/MM/yyyy', { timeZone: 'America/Sao_Paulo' })
        const dateEndDown = format(new Date(zonedTimeToUtc(settings.dateEndDown, 'America/Sao_Paulo')), 'dd/MM/yyyy', { timeZone: 'America/Sao_Paulo' })
        await page.waitForSelector('#cmpDataInicial')
        await page.evaluate(`document.getElementById("cmpDataInicial").value="${dateStartDown}";`)
        await page.evaluate(`document.getElementById("cmpDataFinal").value="${dateEndDown}";`)
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'InputPeriodToDownload'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao informar o período pra download das notas.'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}