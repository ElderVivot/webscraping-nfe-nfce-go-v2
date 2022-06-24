import 'dotenv/config'

import { IDateAdapter } from '@common/adapters/date/date-adapter'
import { makeDateImplementation } from '@common/adapters/date/date-factory'
import { logger } from '@common/log'

import { TSituationNotaFiscal } from './_interfaces'

const getDateStart = (dateFactory: IDateAdapter): Date => {
    const dateStart = dateFactory.subMonths(new Date(), Number(process.env.RETROACTIVE_MONTHS_TO_DOWNLOAD) || 0)
    dateStart.setDate(1)
    return dateStart
}

const getDateEnd = (situationNF = '2'): Date => {
    // const dayFirstSearch = Number(process.env.DAY_FIRST_SEARCH) || 15
    const today = new Date()
    const dayToday = today.getDate()

    const daysToDown = process.env.DAYS_TO_DOWN || '15,'
    const daysToDownSplit = daysToDown.split(',')
    let dayFirstSearch = Number(daysToDownSplit[0])
    for (const day of daysToDownSplit) {
        const dayNumber = Number(day)
        if (dayNumber < dayToday) dayFirstSearch = dayNumber
    }

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

export async function PeriodToDownNFeGoias (situationNotaFiscal: TSituationNotaFiscal): Promise<{dateStart: Date, dateEnd: Date}> {
    const dateFactory = makeDateImplementation()
    try {
        const dateStart = getDateStart(dateFactory)
        const dateEnd = getDateEnd(situationNotaFiscal)

        if (dateStart >= dateEnd) {
            throw 'DONT_HAVE_NEW_PERIOD_TO_PROCESS'
        }

        return {
            dateStart, dateEnd
        }
    } catch (error) {
        if (error === 'DONT_HAVE_NEW_PERIOD_TO_PROCESS') {
            logger.warn({
                msg: 'Nao ha um novo periodo pra processar, ou seja, o ultimo processamento ja buscou o periodo maximo.',
                locationFile: __filename,
                error
            })
        } else if (error === 'DAY_ONE_DONT_DOWN_NOTES_CANCELED') {
            logger.warn({
                msg: 'Dia 1 nao faz download de notas canceladas',
                locationFile: __filename,
                error
            })
        } else {
            logger.error({
                msg: 'Erro',
                locationFile: __filename,
                error
            })
        }
    }
}