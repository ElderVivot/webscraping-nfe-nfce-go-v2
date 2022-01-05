import { parse } from 'date-fns'
import { format, zonedTimeToUtc } from 'date-fns-tz'

export function zeroLeft (valueInsert: string, countZeros: number = 2): string {
    return ('0000'.repeat(countZeros) + valueInsert).slice(-countZeros)
}

export function convertDateToString (date: Date, formatReturn: string = 'yyyy-MM-dd'): string {
    return format(date, formatReturn, { timeZone: 'America/Sao_Paulo' })
}

export function convertStringToDate (dateString: string, formatDate: string = 'dd/MM/yyyy'): Date {
    return new Date(zonedTimeToUtc(parse(dateString, formatDate, new Date('1960-01-01')), 'America/Sao_Paulo'))
}

export function todayLocale (timezone: string = 'America/Sao_Paulo'): Date {
    return new Date(zonedTimeToUtc(new Date(), timezone))
}