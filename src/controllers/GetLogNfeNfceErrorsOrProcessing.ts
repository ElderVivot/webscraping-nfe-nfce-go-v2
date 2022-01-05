import api from '../services/api'

interface ILogNfeNfceErrors {
    id: number,
    wayCertificate: string,
    cgceCompanie: string,
    modelNF: string,
    situacaoNF: string,
    dateStartDown: string,
    dateEndDown: string,
    qtdTimesReprocessed: number,
    pageInicial: number,
    pageFinal: number
}

export default class GetLogNfeNfceErrorsOrProcessing {
    async get (filter: string): Promise<ILogNfeNfceErrors[] | void> {
        try {
            const logNfeNfceErrors = await api.get(`/log_nfe_nfce_go_errors_or_processing${filter}`)
            if (logNfeNfceErrors.status === 200) {
                return logNfeNfceErrors.data
            }
        } catch (error) {
            console.log(`- [controllers-GetLogNfeNfceErrorsOrProcessing] --> Error --> ${error}`)
        }
    }
}