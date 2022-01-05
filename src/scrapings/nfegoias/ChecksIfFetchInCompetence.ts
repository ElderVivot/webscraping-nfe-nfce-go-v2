import 'dotenv/config'
import { Page } from 'puppeteer'

import GetLogFetchCompetence from '../../controllers/GetLogFetchCompetence'
import GetLogFetchCompetenceWarnSuccess from '../../controllers/GetLogFetchCompetenceWarnSuccess'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function ChecksIfFetchInCompetence (page: Page, settings: ISettingsNFeGoias): Promise<void> {
    try {
        const dayStart = new Date(settings.dateStartDown).getDate()
        const dayEnd = new Date(settings.dateEndDown).getDate()
        const month = Number(settings.month)
        const year = Number(settings.year)
        const lastDayOfMonth = new Date(year, month, 0).getDate()

        let filter = `?cgceCompanie=${settings.cgceCompanie}&modelNF=${settings.modelNF}&situacaoNF=${settings.situacaoNF}&month=${settings.month}&year=${settings.year}`

        // when dont reprocessing error
        const getLogFetchCompetence = new GetLogFetchCompetence()
        const dataLog = await getLogFetchCompetence.show(filter)
        const { daymaxdown } = dataLog

        if (settings.situacaoNF === '3' && (dayStart !== 1 || dayEnd !== lastDayOfMonth)) {
            throw 'NOTE_CANCELED_DOWNLOAD_ONLY_FULL_MONTH'
        }

        if (!settings.reprocessingFetchErrorsOrProcessing && daymaxdown && daymaxdown >= dayEnd) {
            throw 'PERIOD_ALREADY_PROCESSED'
        }

        // when reprocessing error
        if (settings.reprocessingFetchErrorsOrProcessing) {
            const typeLogFilter = settings.typeLog === 'processing' ? 'error' : 'processing'
            filter = `${filter}&typeLog=${typeLogFilter}`
            const getLogFetchCompetenceWarnSuccess = new GetLogFetchCompetenceWarnSuccess()
            const dataLogWarnSuccess = await getLogFetchCompetenceWarnSuccess.show(filter)
            const daymaxdownWarnSucess = dataLogWarnSuccess.daymaxdown
            if (daymaxdownWarnSucess && daymaxdownWarnSucess >= dayEnd) {
                throw 'PERIOD_ALREADY_PROCESSED_SUCCESS_OR_WARNING'
            }
        }
    } catch (error) {
        let saveInDB = true
        settings.typeLog = 'error'
        settings.messageLog = 'ChecksIfFetchInCompetence'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao verificar se o período já foi procesado antes.'
        if (error === 'NOTE_CANCELED_DOWNLOAD_ONLY_FULL_MONTH') {
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Nota cancelada faz o download apenas do mês completo'
            saveInDB = false
        }
        if (error === 'PERIOD_ALREADY_PROCESSED') {
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Período já processado anteriormente.'
            saveInDB = false
        }
        if (error === 'PERIOD_ALREADY_PROCESSED_SUCCESS_OR_WARNING') {
            settings.typeLog = 'warning'
            settings.messageLogToShowUser = 'Período que apresentou erro na consulta, já processado e foi realizada com sucesso'
            saveInDB = false
        }
        console.log(`\t[Final-Empresa-Mes] - ${settings.messageLogToShowUser}`)
        console.log('\t-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, null, true)
        await treatsMessageLog.saveLog(saveInDB)
    }
}

// const periodToDownNotesGoiania = new PeriodToDownNotesGoiania({
//     dateHourProcessing: '',
//     hourLog: '',
//     idUser: 0,
//     loguin: '',
//     password: '',
//     inscricaoMunicipal: '4273222'
// })
// periodToDownNotesGoiania.process().then(result => console.log(result))