import { Page } from 'puppeteer'

import GetMaxDateDownNfeNfcePerMonth from '../../controllers/GetMaxDateDownNfeNfcePerMonth'
import IPeriodToDownNotes from '../../models/IPeriodToDownNotes'
import * as functions from '../../utils/functions'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

interface IDateInicialAndFinal {
    inicialDate: string
    finalDate: string
}

export async function SetDateInicialAndFinalOfMonth (page: Page, settings: ISettingsNFeGoias, periodToDown: IPeriodToDownNotes, month: number, year: number): Promise<IDateInicialAndFinal> {
    try {
        let initialDate: Date
        let finalDate: Date

        const yearFinal = periodToDown.dateEnd.getFullYear()
        const monthFinal = periodToDown.dateEnd.getMonth() + 1

        if (settings.reprocessingFetchErrorsOrProcessing) {
            initialDate = periodToDown.dateStart
            finalDate = periodToDown.dateEnd
        } else {
            const daysInitialAndFinalOfMonth = functions.daysInitialAndEndOfMonth(month, year)

            const getMaxDateDownNfeNfcePerMonth = new GetMaxDateDownNfeNfcePerMonth()
            const dataLog = await getMaxDateDownNfeNfcePerMonth.show(`?cgceCompanie=${settings.cgceCompanie}&modelNF=${settings.modelNF}&situacaoNF=${settings.situacaoNF}&month=${month}&year=${year}`)
            const { datedownmax } = dataLog
            if (datedownmax) {
                const dateDownMax = new Date(datedownmax)
                const dayDownMax = dateDownMax.getDate()
                initialDate = new Date(year, month - 1, dayDownMax)
            } else {
                initialDate = daysInitialAndFinalOfMonth.dateInitial
            }

            if (month === monthFinal && year === yearFinal) {
                finalDate = periodToDown.dateEnd
            } else {
                finalDate = daysInitialAndFinalOfMonth.dateFinal
            }
        }

        return {
            inicialDate: functions.convertDateToString(initialDate),
            finalDate: functions.convertDateToString(finalDate)
        }
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'SetDateInicialAndFinalOfMonth'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao verificar o período pra baixar.'
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}