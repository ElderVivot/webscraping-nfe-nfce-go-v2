import { Page } from 'puppeteer'

import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { firstAndLastDayOfMonth } from '@utils/functions'

import { ILogNotaFiscalApi, ISettingsNFeGoias } from './_interfaces'
import { urlBaseApi } from './_urlBaseApi'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function SetDateInicialAndFinalOfMonth (page: Page, settings: ISettingsNFeGoias, month: number, year: number, dateFinalOfPeriodToDown: Date): Promise<ISettingsNFeGoias> {
    try {
        const dateFactory = makeDateImplementation()
        const fetchFactory = makeFetchImplementation()
        const today = new Date()
        const todaySubdays = dateFactory.subDays(today, 32)

        const { firstDay, lastDay } = firstAndLastDayOfMonth(month, year)
        const firstDayString = dateFactory.formatDate(firstDay, 'yyyy-MM-dd')
        const lastDayString = dateFactory.formatDate(lastDay, 'yyyy-MM-dd')

        if (settings.situationNotaFiscal === '2' && todaySubdays > lastDay) {
            throw 'NOTE_CANCELED_DONT_DOWN_SEPARATELY_IF_MORE_31_DAYS'
        }

        const getFinalDate = () => {
            const yearFinal = dateFinalOfPeriodToDown.getFullYear()
            const monthFinal = dateFinalOfPeriodToDown.getMonth() + 1
            if (month === monthFinal && year === yearFinal) return dateFinalOfPeriodToDown
            else return lastDay
        }
        settings.dateStartDown = firstDay
        settings.dateEndDown = getFinalDate()

        const urlBase = `${urlBaseApi}/log_nota_fiscal`
        const urlFilter = `?federalRegistration=${settings.federalRegistration}&modelNotaFiscal=${settings.modelNotaFiscal}&situationNotaFiscal=${settings.situationNotaFiscal}&dateStartDownBetween=${firstDayString}&dateEndDownBetween=${lastDayString}`
        const response = await fetchFactory.get<ILogNotaFiscalApi[]>(`${urlBase}${urlFilter}`, { headers: { tenant: process.env.TENANT } })
        if (response.status >= 400) throw response
        const data = response.data
        if (data.length > 0) {
            const logNotaFiscal = data[data.length - 1]
            const dayDownMax = new Date(logNotaFiscal.dateEndDown).getDate()

            settings.dateStartDown = new Date(year, month - 1, dayDownMax + 1)
            if (settings.dateStartDown >= settings.dateEndDown) {
                throw 'DONT_HAVE_NEW_PERIOD_TO_PROCESS'
            }
        }
        return settings
    } catch (error) {
        let saveInDB = true
        settings.typeLog = 'error'
        settings.messageLog = 'SetDateInicialAndFinalOfMonth'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao buscar o periodo do mes pra download.'
        if (error === 'DONT_HAVE_NEW_PERIOD_TO_PROCESS') {
            saveInDB = false
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Nao ha um novo periodo pra processar, ou seja, o ultimo processamento ja buscou o periodo maximo.'
        }
        if (error === 'NOTE_CANCELED_DONT_DOWN_SEPARATELY_IF_MORE_31_DAYS') {
            saveInDB = false
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Notas canceladas nao faz o download separado se a quantidade de dias da data fim for maior que 31 dias da data atual'
        }
        settings.pathFile = __filename
        handlesFetchError(error, settings.pathFile) // if error is a fetchError

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}