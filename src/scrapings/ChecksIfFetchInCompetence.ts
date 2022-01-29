import 'dotenv/config'
import { Page } from 'puppeteer'

import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'

import { ILogNotaFiscalApi, ISettingsNFeGoias } from './_interfaces'
import { urlBaseApi } from './_urlBaseApi'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ChecksIfFetchInCompetence (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        const dateFactory = makeDateImplementation()
        const fetchFactory = makeFetchImplementation()
        const dayEndDown = new Date(settings.dateEndDown).getDate()
        const dateStartDownString = dateFactory.formatDate(settings.dateStartDown, 'yyyy-MM-dd')
        const dateEndDownString = dateFactory.formatDate(settings.dateEndDown, 'yyyy-MM-dd')

        const urlBase = `${urlBaseApi}/log_nota_fiscal`
        const urlFilter = `?federalRegistration=${settings.federalRegistration}&modelNotaFiscal=${settings.modelNotaFiscal}&situationNotaFiscal=${settings.situationNotaFiscal}&dateStartDownBetween=${dateStartDownString}&dateEndDownBetween=${dateEndDownString}`
        const response = await fetchFactory.get<ILogNotaFiscalApi[]>(`${urlBase}${urlFilter}`, { headers: { tenant: process.env.TENANT } })
        if (response.status >= 400) throw response
        const data = response.data

        if (data.length > 0) {
            for (const logNotaFiscal of data) {
                const { typeLog } = logNotaFiscal
                if (typeLog === 'success') {
                    const dayDownMax = new Date(logNotaFiscal.dateEndDown).getDate()
                    if (dayDownMax >= dayEndDown) throw 'PERIOD_ALREADY_PROCESSED_SUCCESS'
                }
            }
        }
    } catch (error) {
        let saveInDB = true
        settings.typeLog = 'error'
        settings.messageLog = 'ChecksIfFetchInCompetence'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao verificar se o periodo ja foi procesado antes.'
        if (error === 'PERIOD_ALREADY_PROCESSED_SUCCESS') {
            saveInDB = false
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Periodo que apresentou erro na consulta ja foi realizada com sucesso'
        }
        handlesFetchError(error, __filename)

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}