import 'dotenv/config'
import { subMonths } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'
import { Page } from 'puppeteer'

import IPeriodToDownNotes from '../../models/IPeriodToDownNotes'
import * as functions from '../../utils/functions'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

const getDateStart = (/* datedownmax: any */): Date => {
    const dateStart = subMonths(new Date(), Number(process.env.RETROACTIVE_MONTHS_TO_DOWNLOAD) || 0)
    dateStart.setDate(1)
    return dateStart
}

const getDateEnd = (situacaoNF = '2'): Date => {
    const dayFirstSearch = Number(process.env.DAY_FIRST_SEARCH) || 15
    const today = new Date()
    let dateEnd: Date
    const dayToday = today.getDate()
    if (dayToday === 1) {
        dateEnd = new Date(today.getFullYear(), today.getMonth() - 1, dayFirstSearch)
    } else if (dayToday >= 2 && dayToday <= dayFirstSearch + 1) {
        dateEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    } else { // dayToday >= dayFirstSearch+2 && dayToday <= last day of month
        dateEnd = today
        dateEnd.setDate(dayFirstSearch)
    }

    // canceladas --> testing better and so implement, this code above is example that I think is correct
    // if (situacaoNF === '3') {
    //     if (dayToday === 1) {
    //         dateEnd = new Date(today.getFullYear(), today.getMonth() - 1, dayFirstSearch)
    //     } else if (dayToday >= 2 && dayToday <= dayFirstSearch + 1) {
    //         dateEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    //     } else { // dayToday >= dayFirstSearch+2 && dayToday <= last day of month
    //         dateEnd = today
    //         dateEnd.setDate(dayFirstSearch)
    //     }
    // } else {
    //     if (dayToday >= 1 && dayToday <= dayFirstSearch) {
    //         dateEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    //     } else {
    //         dateEnd = new Date(today.getFullYear(), today.getMonth() - 1, dayFirstSearch)
    //     }
    // }
    return dateEnd
}

export async function PeriodToDownNFeGoias (page: Page, settings: ISettingsNFeGoias): Promise<IPeriodToDownNotes> {
    try {
        const dateStart = getDateStart()
        const dateEnd = getDateEnd(settings.situacaoNF)

        settings.dateStartDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(dateStart, 'America/Sao_Paulo')))} 03:00:00 AM`
        settings.dateEndDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(dateEnd, 'America/Sao_Paulo')))} 03:00:00 AM`

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
        settings.messageLogToShowUser = 'Erro ao verificar o período pra baixar.'
        if (error === 'DONT_HAVE_NEW_PERIOD_TO_PROCESS') {
            saveInDB = false
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Não há um novo período pra processar, ou seja, o último processamento já buscou o período máximo.'
        }
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}