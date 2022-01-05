import { zonedTimeToUtc } from 'date-fns-tz'

import GetCompanies from '../controllers/GetCompanies'
import ICompanies from '../models/ICompanies'

export default class GetCompanie {
    private readonly onlyActive: boolean
    private readonly filter: string
    private readonly month: number
    private readonly year: number

    constructor (filter: string, onlyActive: boolean, month: number, year: number) {
        this.filter = filter
        this.onlyActive = onlyActive
        this.month = month
        this.year = year
    }

    async getCompanieActive (companies: Array<ICompanies>): Promise<ICompanies> {
        if (this.onlyActive) {
            for (const companie of companies) {
                const { dateInicialAsClient, dateFinalAsClient, cgce } = companie
                const dateInicialAsClientToDate = dateInicialAsClient ? zonedTimeToUtc(dateInicialAsClient, 'America/Sao_Paulo') : null
                const dateFinalAsClientToDate = dateFinalAsClient ? zonedTimeToUtc(dateFinalAsClient, 'America/Sao_Paulo') : null
                const cgceSanatized = cgce ? cgce.trim : ''
                if (cgceSanatized) {
                    if (!dateInicialAsClientToDate || (dateInicialAsClientToDate.getMonth() + 1 >= this.month && dateInicialAsClientToDate.getFullYear() >= this.year)) {
                        if (!dateFinalAsClientToDate || (dateFinalAsClientToDate.getMonth() + 1 <= this.month && dateFinalAsClientToDate.getFullYear() <= this.year)) {
                            return companie
                        }
                    }
                }
            }
            return companies[0]
        } else {
            return companies[0]
        }
    }

    async getCompanie (): Promise<ICompanies> {
        const getCompanies = new GetCompanies()
        const companies = await getCompanies.getCompanies(this.filter)
        return await this.getCompanieActive(companies)
    }
}

// const getCompanie = new GetCompanie('?inscricaoMunicipal=2502887', true, 1, 2020)
// getCompanie.getCompanie().then(result => console.log(result))