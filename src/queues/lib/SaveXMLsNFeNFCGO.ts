import Queue from 'bull'
import { ISettingsNFeGoias } from 'src/scrapings/nfegoias/ISettingsNFeGoias'

import redisConfig from '../../config/redis'
import SaveLogNfeNfceGO from '../../controllers/SaveLogNfeNfceGO'
import SaveXMLsNFeNFCGO from '../jobs/SaveXMLsNFeNFCGO'

const saveXMLsNFeNFCGO = new Queue(SaveXMLsNFeNFCGO.key, { redis: redisConfig })

saveXMLsNFeNFCGO.on('failed', async (job, error) => {
    const settings: ISettingsNFeGoias = job.data.settings
    const saveLogNfeNfceGO = new SaveLogNfeNfceGO()
    await saveLogNfeNfceGO.saveLog({
        id: settings.id,
        hourLog: settings.hourLog,
        typeLog: 'error',
        messageLog: 'ErrorToProcessDataInQueue',
        messageLogToShowUser: 'Erro ao salvar XMLs na pasta.',
        messageError: error.message,
        urlImageDown: '',
        codeCompanie: settings.codeCompanie,
        nameCompanie: settings.nameCompanie,
        cgceCompanie: settings.cgceCompanie,
        modelNF: settings.modelNF,
        situacaoNF: settings.situacaoNF,
        dateStartDown: settings.dateStartDown,
        dateEndDown: settings.dateEndDown,
        qtdNotesDown: settings.qtdNotes,
        qtdTimesReprocessed: settings.qtdTimesReprocessed,
        qtdPagesTotal: settings.qtdPagesTotal,
        pageInicial: settings.pageInicial,
        pageFinal: settings.pageFinal
    })

    console.log('Job failed', `ID ${settings.id} | ${settings.codeCompanie} - ${settings.nameCompanie} - ${settings.cgceCompanie} | ${settings.modelNF} | ${settings.situacaoNFDescription} | ${settings.dateStartDown} - ${settings.dateEndDown}`)
})

saveXMLsNFeNFCGO.on('completed', async (job) => {
    const settings: ISettingsNFeGoias = job.data.settings
    const saveLogNfeNfceGO = new SaveLogNfeNfceGO()
    await saveLogNfeNfceGO.saveLog({
        id: settings.id,
        wayCertificate: settings.wayCertificate,
        hourLog: settings.hourLog,
        typeLog: settings.qtdPagesTotal === settings.pageFinal ? 'success' : 'processing',
        messageLog: 'SucessToSaveNotes',
        messageLogToShowUser: 'Notas salvas com sucesso',
        messageError: '',
        urlImageDown: '',
        codeCompanie: settings.codeCompanie,
        nameCompanie: settings.nameCompanie,
        cgceCompanie: settings.cgceCompanie,
        modelNF: settings.modelNF,
        situacaoNF: settings.situacaoNF,
        dateStartDown: settings.dateStartDown,
        dateEndDown: settings.dateEndDown,
        qtdNotesDown: settings.qtdNotes,
        qtdTimesReprocessed: settings.qtdTimesReprocessed,
        qtdPagesTotal: settings.qtdPagesTotal,
        pageInicial: settings.pageInicial,
        pageFinal: settings.pageFinal
    })
})

export default saveXMLsNFeNFCGO