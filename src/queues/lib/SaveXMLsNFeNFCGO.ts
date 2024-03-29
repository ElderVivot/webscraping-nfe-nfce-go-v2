import Queue from 'bull'

import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'
import redisConfig from '@config/redis'
import { ILogNotaFiscalApi, ISettingsNFeGoias } from '@scrapings/_interfaces'
import { urlBaseApi } from '@scrapings/_urlBaseApi'

import { SaveXMLsNFeNFCGOJob } from '../jobs/SaveXMLsNFeNFCGO'

const saveXMLsNFeNFCGOLib = new Queue(SaveXMLsNFeNFCGOJob.key, { redis: redisConfig })

async function saveInApi (dataToSave: ILogNotaFiscalApi) {
    const fetchFactory = makeFetchImplementation()

    const urlBase = `${urlBaseApi}/log_nota_fiscal`

    if (dataToSave.idLogNotaFiscal) {
        const response = await fetchFactory.put<ILogNotaFiscalApi[]>(
            `${urlBase}/${dataToSave.idLogNotaFiscal}`,
            { ...dataToSave },
            { headers: { tenant: process.env.TENANT } }
        )
        if (response.status >= 400) throw response
    } else {
        const response = await fetchFactory.post<ILogNotaFiscalApi[]>(
            `${urlBase}`,
            { ...dataToSave },
            { headers: { tenant: process.env.TENANT } }
        )
        if (response.status >= 400) throw response
    }
}

saveXMLsNFeNFCGOLib.on('failed', async (job, error) => {
    const settings: ISettingsNFeGoias = job.data.settings
    try {
        const dataToSave: ILogNotaFiscalApi = {
            idLogNotaFiscal: settings.idLogNotaFiscal,
            wayCertificate: settings.wayCertificate,
            typeLog: 'error',
            messageLog: 'ErrorToProcessDataInQueue',
            messageError: error.message,
            messageLogToShowUser: 'Erro ao salvar XMLs na pasta.',
            federalRegistration: settings.federalRegistration,
            modelNotaFiscal: settings.modelNotaFiscal,
            situationNotaFiscal: settings.situationNotaFiscal,
            typeSearch: settings.typeSearch,
            dateStartDown: new Date(settings.dateStartDown).toISOString(),
            dateEndDown: new Date(settings.dateEndDown).toISOString(),
            qtdNotesDown: settings.qtdNotes,
            qtdTimesReprocessed: settings.qtdTimesReprocessed,
            pageInicial: settings.pageInicial,
            pageFinal: settings.pageFinal,
            qtdPagesTotal: settings.qtdPagesTotal,
            urlPrintLog: settings.urlPrintLog
        }

        await saveInApi(dataToSave)
    } catch (error) {
        const responseFetch = handlesFetchError(error)
        if (responseFetch) logger.error(responseFetch)
        else logger.error(error)
    }

    logger.error('Job failed', `ID ${settings.idLogNotaFiscal} | ${settings.codeCompanieAccountSystem} - ${settings.nameCompanie} - ${settings.federalRegistration} | ${settings.modelNotaFiscal} | ${settings.situationNotaFiscal} | ${settings.dateStartDown} - ${settings.dateEndDown}`)
})

saveXMLsNFeNFCGOLib.on('completed', async (job) => {
    const settings: ISettingsNFeGoias = job.data.settings
    try {
        const dataToSave: ILogNotaFiscalApi = {
            idLogNotaFiscal: settings.idLogNotaFiscal,
            wayCertificate: settings.wayCertificate,
            typeLog: 'success',
            messageLog: 'SucessToSaveNotes',
            messageError: '',
            messageLogToShowUser: 'Notas salvas com sucesso',
            federalRegistration: settings.federalRegistration,
            modelNotaFiscal: settings.modelNotaFiscal,
            situationNotaFiscal: settings.situationNotaFiscal,
            typeSearch: settings.typeSearch,
            dateStartDown: new Date(settings.dateStartDown).toISOString(),
            dateEndDown: new Date(settings.dateEndDown).toISOString(),
            qtdNotesDown: settings.qtdNotes,
            qtdTimesReprocessed: settings.qtdTimesReprocessed,
            pageInicial: settings.pageInicial,
            pageFinal: settings.pageFinal,
            qtdPagesTotal: settings.qtdPagesTotal,
            urlPrintLog: settings.urlPrintLog
        }

        await saveInApi(dataToSave)
    } catch (error) {
        const responseFetch = handlesFetchError(error)
        if (responseFetch) logger.error(responseFetch)
        else logger.error(error)
    }
})

export { saveXMLsNFeNFCGOLib }