import 'dotenv/config'

import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'

import { cnaesOfCtesToIssuesNotes } from '../../database-local.json'
import { ICertifateApi, ICompanies, ISettingsNFeGoias } from './_interfaces'
import { urlBaseApi } from './_urlBaseApi'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

const { COMPANIES_ONLY_ACTIVE } = process.env
let companiesOnlyActive = true
if (COMPANIES_ONLY_ACTIVE && COMPANIES_ONLY_ACTIVE !== 'true') companiesOnlyActive = false

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

export async function CheckIfCompanieIsValid (settings: ISettingsNFeGoias, companie: ICompanies): Promise<ISettingsNFeGoias> {
    try {
        const fetchFactory = makeFetchImplementation()

        checkIfCompanieIsActiveInCompetence(settings, companie, companiesOnlyActive)

        settings.idCompanie = companie.idCompanie
        settings.federalRegistration = companie.federalRegistration
        settings.codeCompanieAccountSystem = companie.codeCompanieAccountSystem
        settings.nameCompanie = companie.name
        settings.wayCertificate = companie.urlCert ? companie.urlCert : 'empty'
        settings.commomNameCert = companie.commomNameCert ? companie.commomNameCert : ''

        if (companie.stateCity !== 'GO') {
            throw 'COMPANIE_IS_NOT_STATE_GO'
        }
        if (companiesOnlyActive && !companie.stateRegistration) {
            throw 'COMPANIE_DONT_HAVE_INSCRICAO_ESTADUAL'
        }
        if (settings.modelNotaFiscal === '57' && !checkIfCteCnaesAllowIssueNotes(companie.cnaes)) {
            throw 'COMPANIE_DONT_HAVE_CNAES_ALLOW_TO_ISSUE_CTES'
        }
        if (!companie.urlCert || companie.urlCert === 'empty') {
            throw 'COMPANIE_DONT_HAVE_CERTIFICATE'
        }
        if (companie.endDateValidityCert && new Date(companie.endDateValidityCert) < new Date()) {
            throw 'COMPANIE_WITH_CERTIFICATE_OVERDUE'
        }

        if (companie.idCertificate) {
            const responseCertificate = await fetchFactory.get<ICertifateApi>(`${urlBaseApi}/certificate/${companie.idCertificate}/show_with_decrypt_password`, { headers: { tenant: process.env.TENANT } })
            const certificate = responseCertificate.data
            settings.passwordCert = certificate ? certificate.passwordDecrypt : ''
            settings.commomNameCert = certificate ? certificate.commomName : ''
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
        if (error === 'COMPANIE_DONT_HAVE_CERTIFICATE') {
            settings.messageLogToShowUser = 'Empresa sem certificado configurado.'
        }
        if (error === 'COMPANIE_WITH_CERTIFICATE_OVERDUE') {
            settings.messageLogToShowUser = 'Empresa com certificado vencido.'
        }
        settings.pathFile = __filename

        const treatsMessageLog = new TreatsMessageLogNFeGoias(null, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}