import { IFetchAdapter } from './fetch-adapter'
import { FetchImplementation } from './fetch-implementation'

export function makeFetchImplementation (): IFetchAdapter {
    return new FetchImplementation()
}