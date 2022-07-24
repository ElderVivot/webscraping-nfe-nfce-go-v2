import Queue from 'bull'

import { makeFetchImplementation } from '@common/adapters/fetch/fetch-factory'
import { handlesFetchError } from '@common/error/fetchError'
import { logger } from '@common/log'
import redisConfig from '@config/redis'
import { ILogNotaFiscalApi, ISettingsNFeGoias } from '@scrapings/_interfaces'
import { urlBaseApi } from '@scrapings/_urlBaseApi'
import { saveLogDynamo } from '@services/dynamodb'

import { SaveXMLsNFeNFCGOJob } from '../jobs/SaveXMLsNFeNFCGO'

const saveXMLsNFeNFCGOLib = new Queue(SaveXMLsNFeNFCGOJob.key, { redis: redisConfig })

saveXMLsNFeNFCGOLib.on('failed', async (job, error) => {
    const fetchFactory = makeFetchImplementation()

    const settings: ISettingsNFeGoias = job.data.settings
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
        dateStartDown: new Date(settings.dateStartDown).toISOString(),
        dateEndDown: new Date(settings.dateEndDown).toISOString(),
        qtdNotesDown: settings.qtdNotes,
        qtdTimesReprocessed: settings.qtdTimesReprocessed,
        pageInicial: settings.pageInicial,
        pageFinal: settings.pageFinal,
        qtdPagesTotal: settings.qtdPagesTotal
    }

    const urlBase = `${urlBaseApi}/log_nota_fiscal`
    try {
        const response = await fetchFactory.put<ILogNotaFiscalApi[]>(
            `${urlBase}/${dataToSave.idLogNotaFiscal}`,
            { ...dataToSave },
            { headers: { tenant: process.env.TENANT } }
        )
        if (response.status >= 400) throw response

        await saveLogDynamo(dataToSave)
    } catch (error) {
        const responseFetch = handlesFetchError(error)
        await saveLogDynamo({
            messageError: error,
            messageLog: 'SaveXMLsNFeNFCGO',
            pathFile: __filename,
            typeLog: 'error',
            errorResponseApi: responseFetch
        })
    }

    logger.error('Job failed', `ID ${settings.idLogNotaFiscal} | ${settings.codeCompanieAccountSystem} - ${settings.nameCompanie} - ${settings.federalRegistration} | ${settings.modelNotaFiscal} | ${settings.situationNotaFiscal} | ${settings.dateStartDown} - ${settings.dateEndDown}`)
})

saveXMLsNFeNFCGOLib.on('completed', async (job) => {
    const fetchFactory = makeFetchImplementation()

    const settings: ISettingsNFeGoias = job.data.settings
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
        dateStartDown: new Date(settings.dateStartDown).toISOString(),
        dateEndDown: new Date(settings.dateEndDown).toISOString(),
        qtdNotesDown: settings.qtdNotes,
        qtdTimesReprocessed: settings.qtdTimesReprocessed,
        pageInicial: settings.pageInicial,
        pageFinal: settings.pageFinal,
        qtdPagesTotal: settings.qtdPagesTotal
    }

    const urlBase = `${urlBaseApi}/log_nota_fiscal`
    try {
        const response = await fetchFactory.put<ILogNotaFiscalApi[]>(
            `${urlBase}/${dataToSave.idLogNotaFiscal}`,
            { ...dataToSave },
            { headers: { tenant: process.env.TENANT } }
        )
        if (response.status >= 400) throw response

        await saveLogDynamo(dataToSave)
    } catch (error) {
        const responseFetch = handlesFetchError(error)
        await saveLogDynamo({
            messageError: error,
            messageLog: 'SaveXMLsNFeNFCGO',
            pathFile: __filename,
            typeLog: 'error',
            errorResponseApi: responseFetch
        })
    }
})

export { saveXMLsNFeNFCGOLib }