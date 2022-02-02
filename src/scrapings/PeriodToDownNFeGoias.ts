import 'dotenv/config'
import { Page } from 'puppeteer'

import { IDateAdapter } from '@common/adapters/date/date-adapter'
import { makeDateImplementation } from '@common/adapters/date/date-factory'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

const getDateStart = (dateFactory: IDateAdapter): Date => {
    const dateStart = dateFactory.subMonths(new Date(), Number(process.env.RETROACTIVE_MONTHS_TO_DOWNLOAD) || 0)
    dateStart.setDate(1)
    return dateStart
}

const getDateEnd = (situationNF = '2'): Date => {
    const dayFirstSearch = Number(process.env.DAY_FIRST_SEARCH) || 15
    const today = new Date()
    const dayToday = today.getDate()

    if (situationNF === '2') { // notes canceled
        if (dayToday >= 2) {
            return new Date(today.getFullYear(), today.getMonth(), 0)
        } else {
            throw 'DAY_ONE_DONT_DOWN_NOTES_CANCELED'
        }
    } else {
        if (dayToday >= 1 && dayToday <= dayFirstSearch) {
            return new Date(today.getFullYear(), today.getMonth(), 0)
        } else {
            return new Date(today.getFullYear(), today.getMonth(), dayFirstSearch)
        }
    }
}

export async function PeriodToDownNFeGoias (page: Page, settings: ISettingsNFeGoias): Promise<{dateStart: Date, dateEnd: Date}> {
    const dateFactory = makeDateImplementation()
    try {
        const dateStart = getDateStart(dateFactory)
        const dateEnd = getDateEnd(settings.situationNotaFiscal)

        if (dateStart >= dateEnd) {
            throw 'DONT_HAVE_NEW_PERIOD_TO_PROCESS'
        }

        return {
            dateStart, dateEnd
        }
    } catch (error) {
        let saveInDB = true
        settings.typeLog = 'error'
        settings.messageLog = 'PeriodToDownNFeGoias'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao verificar o periodo pra baixar.'
        if (error === 'DONT_HAVE_NEW_PERIOD_TO_PROCESS') {
            saveInDB = false
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Nao ha um novo periodo pra processar, ou seja, o ultimo processamento ja buscou o periodo maximo.'
        }
        if (error === 'DAY_ONE_DONT_DOWN_NOTES_CANCELED') {
            saveInDB = false
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Dia 1 nao faz download de notas canceladas'
        }
        settings.pathFile = __filename

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}