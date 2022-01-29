export type TModelNotaFiscal = '55' | '65' | '57'
export type TSituationNotaFiscal = '0' | '1' | '2' | '3'
export type TTypeLogNotaFiscal = 'success' | 'warning' | 'error' | 'processing' | 'to_process'
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
}

export interface ISettingsNFeGoias {
    wayCertificate?: string
    idLogNotaFiscal?: string
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
}

export interface ICompanies {
    idCompanie: string
    createdAt: Date
    updatedAt: Date
    codeCompanieAccountSystem: string
    name: string
    nickName: string
    typeFederalRegistration: ETypeFederalRegistration
    federalRegistration: string
    stateRegistration: string
    cityRegistration: string
    status: ECompanieStatus
    dddPhone: number
    phone: string
    email: string
    neighborhood: string
    street: string
    zipCode: string
    complement: string
    referency: string
    dateInicialAsCompanie: Date
    dateInicialAsClient: Date
    dateFinalAsClient: Date
    cnaes: string
    taxRegime: '01' | '02' | '03' | '99'
    idCity: number,
    stateCity: string,
    nameCity: string
}