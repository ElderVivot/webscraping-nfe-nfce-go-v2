import { Page } from 'puppeteer'

import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'

import { ICompanies, ISettingsNFeGoias } from './_interfaces'
import { urlBaseApi } from './_urlBaseApi'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

async function getCompanieActive (companies: Array<ICompanies>, onlyActive: boolean, year: number, month: number): Promise<ICompanies> {
    if (onlyActive) {
        for (const companie of companies) {
            const { dateInicialAsClient, dateFinalAsClient, federalRegistration } = companie
            const dateInicialAsClientToDate = dateInicialAsClient ? new Date(dateInicialAsClient) : null
            const dateFinalAsClientToDate = dateFinalAsClient ? new Date(dateFinalAsClient) : null
            const cgceSanatized = federalRegistration ? federalRegistration.trim : ''
            if (cgceSanatized) {
                if (!dateInicialAsClientToDate || (dateInicialAsClientToDate.getMonth() + 1 >= month && dateInicialAsClientToDate.getFullYear() >= year)) {
                    if (!dateFinalAsClientToDate || (dateFinalAsClientToDate.getMonth() + 1 <= month && dateFinalAsClientToDate.getFullYear() <= year)) {
                        return companie
                    }
                }
            }
        }
        return companies[0]
    } else return companies[0]
}

export async function CheckIfCompanieIsValid (page: Page, settings: ISettingsNFeGoias): Promise<ISettingsNFeGoias> {
    try {
        const fetchFactory = makeFetchImplementation()

        const companiesOnlyActive = process.env.COMPANIES_ONLY_ACTIVE === 'true'

        const urlBase = `${urlBaseApi}/companie`
        const urlFilter = `?federalRegistration=${settings.federalRegistration}`
        const response = await fetchFactory.get<ICompanies[]>(`${urlBase}${urlFilter}`, { headers: { tenant: process.env.TENANT } })
        const data = response.data
        const companie = await getCompanieActive(data, companiesOnlyActive, settings.year, settings.month)
        console.log(companie)

        settings.codeCompanieAccountSystem = companie ? companie.codeCompanieAccountSystem : ''
        settings.nameCompanie = companie ? companie.name : settings.nameCompanie

        if (companiesOnlyActive && !settings.codeCompanieAccountSystem) {
            throw 'COMPANIE_NOT_CLIENT_THIS_ACCOUNTING_OFFICE'
        }
        if (companiesOnlyActive && companie.stateCity !== 'GO') {
            throw 'COMPANIE_IS_NOT_STATE_GO'
        }
        if (companiesOnlyActive && !companie.stateRegistration) {
            throw 'COMPANIE_DONT_HAVE_INSCRICAO_ESTADUAL'
        }
        return settings
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'CheckIfCompanieIsActive'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao checar se empresa está ativa como cliente da contabilidade.'

        if (String(error).indexOf('COMPANIE') >= 0) settings.typeLog = 'warning'
        if (error === 'COMPANIE_NOT_CLIENT_THIS_ACCOUNTING_OFFICE') {
            settings.messageLogToShowUser = 'Empresa não é cliente desta contabilidade neste período.'
        }
        if (error === 'COMPANIE_IS_NOT_STATE_GO') {
            settings.messageLogToShowUser = 'Empresa não é do estado de GO.'
        }
        if (error === 'COMPANIE_DONT_HAVE_INSCRICAO_ESTADUAL') {
            settings.messageLogToShowUser = 'Empresa sem inscrição estadual no cadastro.'
        }
        settings.pathFile = __filename

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}