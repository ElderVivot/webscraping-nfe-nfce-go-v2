import { Page } from 'playwright'

// import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'
import { s3Factory } from '@services/s3'

import { ISettingsNFeGoias } from './_interfaces'
// import { urlBaseApi } from './_urlBaseApi'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

async function getQtdNotes (page: Page): Promise<number> {
    try {
        const qtdNotesText: string = await page.$eval('.table-legend-right-container > :nth-child(1)', element => element.textContent)
        const qtdNotes: number = Number(qtdNotesText)
        return qtdNotes
    } catch (error) {
        return 0
    }
}

async function saveScreenshot (page: Page, settings: ISettingsNFeGoias) {
    try {
        // const fetchFactory = makeFetchImplementation()
        const s3 = s3Factory()
        // const urlBase = `${urlBaseApi}/log_nota_fiscal`

        const screenshot = await page.screenshot({ type: 'png', fullPage: true })
        const resultUpload = await s3.upload(screenshot, `${process.env.TENANT}/log-nota-fiscal`, 'png', 'image/png', 'bayhero-logs-functional')

        const { urlPrintLog } = settings
        if (urlPrintLog) {
            const key = urlPrintLog.split('.com/')[1]
            await s3.delete(key, 'bayhero-logs-functional')
        }
        return resultUpload.Location
    } catch (error) {
        const responseAxios = handlesFetchError(error)
        if (responseAxios) logger.error(responseAxios)
        else logger.error(error)
    }
}

export async function GetQuantityNotes (page: Page, settings: ISettingsNFeGoias): Promise<ISettingsNFeGoias> {
    try {
        await page.waitForTimeout(3000)

        settings.urlPrintLog = await saveScreenshot(page, settings)

        const qtdNotes = await getQtdNotes(page)
        settings.qtdNotes = qtdNotes
        return settings
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'GetQuantityNotes'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao pegar quantidade das notas.'

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}