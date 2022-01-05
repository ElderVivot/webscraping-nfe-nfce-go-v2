export interface ICertifate {
    numeroSerie: string
    notBefore: Date
    notAfter: Date
    requerenteCN: string
    requerenteOU: string
    typeCgceCertificate: string,
    nameCertificate?: string
}