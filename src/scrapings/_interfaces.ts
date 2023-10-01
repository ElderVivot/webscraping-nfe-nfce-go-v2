export type TModelNotaFiscal = '55' | '65' | '57'
export type TSituationNotaFiscal = '0' | '1' | '2' | '3'
export type TTypeLogNotaFiscal = 'success' | 'warning' | 'error' | 'processing' | 'to_process'
export type TTaxRegime = '01' | '02' | '03' | '99'
export enum ETypeFederalRegistration {cnpj = 'cnpj', cpf = 'cpf', cei = 'cei', caepf = 'caepf', foreign = 'foreign'}
export enum ECompanieStatus {ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE'}

export interface ILogNotaFiscalApi {
    idLogNotaFiscal: string
    idCompanie?: string
    federalRegistration?: string
    createdAt?:Date
    updatedAt?:Date
    modelNotaFiscal: TModelNotaFiscal
    situationNotaFiscal: TSituationNotaFiscal
    typeSearch: string
    dateStartDown:string
    dateEndDown:string
    typeLog: TTypeLogNotaFiscal
    messageLog: string
    messageLogToShowUser: string
    wayCertificate: string
    messageError: string
    qtdNotesDown: number
    qtdTimesReprocessed: number
    pageInicial: number
    pageFinal: number
    qtdPagesTotal: number
    urlPrintLog: string
    taxRegime?: TTaxRegime
    codeCompanieAccountSystem?: string
    nameCompanie?: string
    typeFederalRegistration?: ETypeFederalRegistration
    cnaes?: string
    commomNameCert?: string
    endDateValidityCert?: Date
    stateCity?: string
    stateRegistration?: string
    dateInicialAsClient?: Date
    dateFinalAsClient?: Date
    dateInicialAsCompanie?: Date
    idCertificate?: string
    statusCompanie?: ECompanieStatus
}

export interface ISettingsNFeGoias {
    wayCertificate?: string
    passwordCert?: string
    commomNameCert?: string
    idLogNotaFiscal?: string
    idCompanie?: string
    typeLog?: TTypeLogNotaFiscal
    codeCompanieAccountSystem?: string
    nameCompanie?: string
    federalRegistration?: string
    modelNotaFiscal?: TModelNotaFiscal
    situationNotaFiscal?: TSituationNotaFiscal
    situacaoNFDescription?: string
    entradasOrSaidas?: string
    typeNF?: string
    messageError?: string
    messageLog?: string
    messageLogToShowUser?: string
    error?: string
    valueLabelSite?: string
    dateStartDown?: Date
    dateEndDown?: Date
    year?: number
    month?: number
    qtdNotes?: number
    pageInicial?: number
    pageFinal?: number
    qtdPagesTotal?: number
    qtdTimesReprocessed?: number
    pathFile?: string
    nameStep?: string
    errorResponseApi?: any
    urlPrintLog?: string
    tokenCaptcha?: string
    typeSearch?: string
}

export interface ICompanies {
    idCompanie: string
    createdAt?: Date
    updatedAt?: Date
    codeCompanieAccountSystem: string
    name: string
    nickName?: string
    typeFederalRegistration: ETypeFederalRegistration
    federalRegistration: string
    stateRegistration: string
    cityRegistration?: string
    status: ECompanieStatus
    dddPhone?: number
    phone?: string
    email?: string
    neighborhood?: string
    street?: string
    zipCode?: string
    complement?: string
    referency?: string
    dateInicialAsCompanie: Date
    dateInicialAsClient: Date
    dateFinalAsClient: Date
    cnaes: string
    taxRegime?: '01' | '02' | '03' | '99'
    idCity?: number
    stateCity: string
    nameCity?: string
    urlCert: string
    endDateValidityCert: Date
    idCertificate: string
    commomNameCert?: string
    eCpfCnpjCert?: 'eCNPJ' | 'eCPF'
    dateEndDown?: string
}

export interface ICertifateApi {
    idCertificate: string
    createdAt:Date
    updatedAt:Date
    password: string
    commomName: string
    startDateValidity:Date
    endDateValidity:Date
    nameCert: string
    federalRegistration: string
    eCpfCnpj: 'eCPF' | 'eCNPJ'
    urlSaved: string
    hasProcurationEcac: boolean
    passwordDecrypt?: string
}