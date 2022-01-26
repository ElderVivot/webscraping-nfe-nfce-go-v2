import { IDateAdapter } from './date-adapter'
import { DateImplementation } from './date-implementation'

export function makeDateImplementation (): IDateAdapter {
    return new DateImplementation()
}