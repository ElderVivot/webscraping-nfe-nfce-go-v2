import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'

import { cnaesOfCtesToIssuesNotes } from '../../database-local.json'
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

function checkIfCteCnaesAllowIssueNotes (cnaes: string): boolean {
    if (!cnaes) return true
    for (const cnae of cnaesOfCtesToIssuesNotes) {
        if (cnaes.indexOf(cnae.toString()) >= 0) return true
    }
    return false
}

function checkIfCompanieIsActiveInCompetence (settings: ISettingsNFeGoias, companie: ICompanies, onlyActive: boolean) {
    if (onlyActive) {
        if (!companie) throw 'COMPANIE_DONT_ACTIVE_THIS_COMPETENCE'
        const dateCompetence = new Date(settings.year, settings.month, 0)
        const { dateInicialAsClient, dateFinalAsClient } = companie
        const dateInicialAsClientToDate = dateInicialAsClient ? new Date(dateInicialAsClient) : null
        const dateFinalAsClientToDate = dateFinalAsClient ? new Date(dateFinalAsClient) : null
        if (dateInicialAsClientToDate && dateInicialAsClientToDate > dateCompetence) throw 'COMPANIE_DONT_ACTIVE_THIS_COMPETENCE'
        if (dateFinalAsClientToDate && dateFinalAsClientToDate < dateCompetence) throw 'COMPANIE_DONT_ACTIVE_THIS_COMPETENCE'
    }
}

export async function CheckIfCompanieIsValid (settings: ISettingsNFeGoias, companieArgument: ICompanies = null): Promise<ISettingsNFeGoias> {
    let companie: ICompanies
    try {
        const fetchFactory = makeFetchImplementation()

        const companiesOnlyActive = process.env.COMPANIES_ONLY_ACTIVE === 'true'

        if (!companieArgument) {
            const urlBase = `${urlBaseApi}/companie`
            const urlFilter = `?federalRegistration=${settings.federalRegistration}`
            const response = await fetchFactory.get<ICompanies[]>(`${urlBase}${urlFilter}`, { headers: { tenant: process.env.TENANT } })
            const data = response.data
            companie = await getCompanieActive(data, companiesOnlyActive, settings.year, settings.month)
        } else {
            companie = companieArgument
        }

        checkIfCompanieIsActiveInCompetence(settings, companie, companiesOnlyActive)

        settings.codeCompanieAccountSystem = companie ? companie.codeCompanieAccountSystem : ''
        settings.nameCompanie = companie ? companie.name : settings.nameCompanie

        if (companiesOnlyActive && companie.stateCity !== 'GO') {
            throw 'COMPANIE_IS_NOT_STATE_GO'
        }
        if (companiesOnlyActive && !companie.stateRegistration) {
            throw 'COMPANIE_DONT_HAVE_INSCRICAO_ESTADUAL'
        }
        if (settings.modelNotaFiscal === '57' && !checkIfCteCnaesAllowIssueNotes(companie.cnaes)) {
            throw 'COMPANIE_DONT_HAVE_CNAES_ALLOW_TO_ISSUE_CTES'
        }
        return settings
    } catch (error) {
        let saveInDB = true
        settings.typeLog = 'error'
        settings.messageLog = 'CheckIfCompanieIsActive'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao checar se empresa está ativa como cliente da contabilidade.'

        if (String(error).indexOf('COMPANIE') >= 0) settings.typeLog = 'warning'
        if (error === 'COMPANIE_IS_NOT_STATE_GO') {
            settings.messageLogToShowUser = 'Empresa não é do estado de GO.'
        }
        if (error === 'COMPANIE_DONT_HAVE_INSCRICAO_ESTADUAL') {
            settings.messageLogToShowUser = 'Empresa sem inscrição estadual no cadastro.'
        }
        if (error === 'COMPANIE_DONT_HAVE_CNAES_ALLOW_TO_ISSUE_CTES') {
            settings.messageLogToShowUser = 'Empresa sem os CNAEs necessários pra emissão de CT-e: https://www.economia.go.gov.br/receita-estadual/documentos-fiscais/cte.html'
        }
        if (error === 'COMPANIE_DONT_ACTIVE_THIS_COMPETENCE') {
            saveInDB = false
            settings.messageLogToShowUser = 'Empresa não é cliente desta contabilidade neste período.'
        }
        settings.pathFile = __filename

        const treatsMessageLog = new TreatsMessageLogNFeGoias(null, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}