import { subHours, subDays, subMonths, parse, format } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'

import { IDateAdapter } from './date-adapter'

export class DateImplementation implements IDateAdapter {
    zonedTimeToUtc (date: string | number | Date, timeZone: string): Date {
        const newDate = zonedTimeToUtc(date, timeZone)
        if (date) return newDate
        else return null
    }

    subHours (date: number | Date, amount: number): Date {
        return subHours(date, amount)
    }

    subDays (date: number | Date, amount: number): Date {
        return subDays(date, amount)
    }

    subMonths (date: number | Date, amount: number): Date {
        return subMonths(date, amount)
    }

    parseDate (date: string, formatString: string): Date {
        return parse(date, formatString, new Date('1900-01-01'))
    }

    formatDate (date: Date | number, formatString: string): string {
        return format(date, formatString)
    }
}