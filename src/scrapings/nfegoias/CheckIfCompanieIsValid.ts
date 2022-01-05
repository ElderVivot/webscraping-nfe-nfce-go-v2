import { Page } from 'puppeteer'

import GetCompanie from '../../services/GetCompanie'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

import 'dotenv/config'

const isOnlyCompanieActive = (): boolean => {
    let companiesOnlyActive = false
    if (process.env.COMPANIES_ONLY_ACTIVE === 'true') {
        companiesOnlyActive = true
    }
    return companiesOnlyActive
}

export async function CheckIfCompanieIsValid (page: Page, settings: ISettingsNFeGoias): Promise<ISettingsNFeGoias> {
    try {
        const companiesOnlyActive = isOnlyCompanieActive()
        const { cgceCompanie, month, year } = settings
        const getCompanie = new GetCompanie(`?cgce=${cgceCompanie}`, companiesOnlyActive, Number(month), year)
        const companie = await getCompanie.getCompanie()

        settings.codeCompanie = companie ? companie.code : ''
        settings.nameCompanie = companie ? companie.name : settings.nameCompanie

        if (companiesOnlyActive && !settings.codeCompanie) {
            throw 'COMPANIE_NOT_CLIENT_THIS_ACCOUNTING_OFFICE'
        }
        if (companiesOnlyActive && companie.uf !== 'GO') {
            throw 'COMPANIE_IS_NOT_STATE_GO'
        }
        if (companiesOnlyActive && !companie.inscricaoEstadual) {
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
        console.log(`[Final] - ${settings.messageLogToShowUser}`)
        console.log('-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog()
    }
}