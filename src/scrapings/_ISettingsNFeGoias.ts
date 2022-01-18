export interface ISettingsNFeGoias {
    wayCertificate?: string
    dataCertificate?: Buffer
    password?: string
    numeroSerie?: string
    id?: number
    typeLog?: 'success' | 'error' | 'warning' | 'processing' | 'to_process'
    codeCompanie?: string
    nameCompanie?: string
    cgceCompanie?: string
    modelNF?: string
    situacaoNF?: string
    situacaoNFDescription?: string
    entradasOrSaidas?: string
    typeNF?: string
    messageError?: string
    messageLog?: string
    messageLogToShowUser?: string
    error?: string
    valueLabelSite?: string
    dateStartDown?: string
    dateEndDown?: string
    year?: number
    month?: string
    qtdNotes?: number
    pageInicial?: number
    pageFinal?: number
    qtdPagesTotal?: number
    qtdTimesReprocessed?: number
    reprocessingFetchErrorsOrProcessing?: boolean
}