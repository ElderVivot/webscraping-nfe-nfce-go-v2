export function returnMonthsOfYear (year: number, filterMonthStart: number, filterYearStart: number, filterMonthEnd: number, filterYearEnd: number): number[] {
    const months = []
    if (filterYearStart > filterYearEnd || (filterYearStart === filterYearEnd && filterMonthStart > filterMonthEnd)) {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }

    if (year === filterYearStart && year === filterYearEnd) {
        while (filterMonthStart <= filterMonthEnd) {
            months.push(filterMonthStart)
            filterMonthStart++
        }
        return months
    } else if (year === filterYearStart) {
        while (filterMonthStart <= 12) {
            months.push(filterMonthStart)
            filterMonthStart++
        }
        return months
    } else if (year === filterYearEnd) {
        let inicial = 1
        while (inicial <= filterMonthEnd) {
            months.push(inicial)
            inicial++
        }
        return months
    } else {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }
}

export function zeroLeft (valueInsert: string, countZeros: number = 2): string {
    return ('0000'.repeat(countZeros) + valueInsert).slice(-countZeros)
}

interface IDateInicialEnd {
    dateInitial: Date,
    dateFinal: Date
}
export function daysInitialAndEndOfMonth (month: number, year: number): IDateInicialEnd {
    const dateInitial = new Date(year, month - 1, 1)
    const dateFinal = new Date(year, month, 0)

    return {
        // dateInitial: `${dateInitial.getFullYear()}-${zeroLeft(String(dateInitial.getMonth() + 1))}-${zeroLeft(String(dateInitial.getDate()))}`,
        // dateFinal: `${dateFinal.getFullYear()}-${zeroLeft(String(dateFinal.getMonth() + 1))}-${zeroLeft(String(dateFinal.getDate()))}`
        dateInitial, dateFinal
    }
}

export function convertDateToString (date: Date): string {
    return `${date.getFullYear()}-${zeroLeft(String(date.getMonth() + 1))}-${zeroLeft(String(date.getDate()))}`
}

export function returnDataInDictOrArray (data: any, array: Array<any>, valueDefault = ''): any {
    try {
        let dataAccumulated = ''
        for (let i = 0; i < array.length; i++) {
            if (i === 0) {
                dataAccumulated = data[array[i]]
            } else {
                dataAccumulated = dataAccumulated[array[i]]
            }
        }
        return dataAccumulated
    } catch (error) {
        return valueDefault
    }
}

export function minimalizeSpaces (text: string): string {
    let result = text
    while (result.indexOf('  ') >= 0) {
        result = result.replace('  ', ' ')
    }
    return result.trim()
}

export function treateTextField (value: string): string {
    const result = value.trim().normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z ])/g, '').toUpperCase()
    return minimalizeSpaces(result)
}