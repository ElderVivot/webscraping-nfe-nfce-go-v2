import Queue from 'bull'
// import { ISettingsNFeGoias } from 'src/scrapings/nfegoias/ISettingsNFeGoias'

import redisConfig from '../../config/redis'
// import SaveLogNfeNfceGO from '../../controllers/SaveLogNfeNfceGO'
import { ScrapingNotes } from '../jobs/ScrapingNotes'

const scrapingNotes = new Queue(ScrapingNotes.key, { redis: redisConfig })

// dont save because can process again if data already download
// scrapingNotes.on('failed', async (job, error) => {
//     const settings: ISettingsNFeGoias = job.data.settings
//     const saveLogNfeNfceGO = new SaveLogNfeNfceGO()
//     await saveLogNfeNfceGO.saveLog({
//         id: settings.id,
//         hourLog: settings.hourLog,
//         typeLog: 'error',
//         messageLog: 'ErrorWebScraping',
//         messageLogToShowUser: 'Erro ao salvar XMLs na pasta.',
//         messageError: error.message,
//         urlImageDown: '',
//         codeCompanie: settings.codeCompanie,
//         nameCompanie: settings.nameCompanie,
//         cgceCompanie: settings.cgceCompanie,
//         modelNF: settings.modelNF,
//         dateStartDown: settings.dateStartDown,
//         dateEndDown: settings.dateEndDown,
//         qtdNotesDown: settings.qtdNotes,
//         qtdTimesReprocessed: settings.qtdTimesReprocessed
//     })
// })

export { scrapingNotes }