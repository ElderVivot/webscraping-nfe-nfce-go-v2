import { zonedTimeToUtc } from 'date-fns-tz'
// import path from 'path'
// import puppeteer from 'puppeteer-core'
import puppeteer from 'puppeteer'
// import puppeteer from 'puppeteer-extra'
// import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'
import 'dotenv/config'

import { cleanDataObject } from '../../utils/clean-data-object'
import * as functions from '../../utils/functions'
import { ChangeCnpj } from './ChangeCnpj'
import { CheckIfCompanieIsValid } from './CheckIfCompanieIsValid'
import { CheckIfDownloadInProgress } from './CheckIfDownloadInProgress'
import { CheckIfSemResultados } from './CheckIfSemResultados'
import { ChecksIfFetchInCompetence } from './ChecksIfFetchInCompetence'
import { ClickDownloadAll } from './ClickDownloadAll'
import { ClickDownloadModal } from './ClickDownloadModal'
import { ClickOkDownloadFinish } from './ClickOkDownloadFinish'
// import { CloseOnePage } from './CloseOnePage'
import { CreateFolderToSaveXmls } from './CreateFolderToSaveXmls'
import { GetCnpjs } from './GetCnpjs'
import { GetQuantityNotes } from './GetQuantityNotes'
import { GoesThroughCaptcha } from './GoesThroughCaptcha'
import { InputModeloToDownload } from './InputModeloToDownload'
import { InputPeriodToDownload } from './InputPeriodToDownload'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
import { LoguinCertificado } from './LoguinCertificado'
import { PeriodToDownNFeGoias } from './PeriodToDownNFeGoias'
import { SendLastDownloadToQueue } from './SendLastDownloadToQueue'
import { SetDateInicialAndFinalOfMonth } from './SetDateInicialAndFinalOfMonth'

const modelosNFe = process.env.MODELOS_NFs.split(',') || ['55', '65', '57']
const situacaoNFs = ['2', '3']

function typeNF (modelo: string): string {
    if (modelo === '55') return 'NF-e'
    else if (modelo === '57') return 'CT-e'
    else if (modelo === '65') return 'NFC-e'
    else return 'DESCONHECIDO'
}

function getDescriptionSituacaoNF (situacao: string): string {
    if (situacao === '2') return 'Autorizadas'
    else if (situacao === '3') return 'Canceladas'
    else return 'DESCONHECIDO'
}

export async function MainNFGoias (settings: ISettingsNFeGoias = {}): Promise<void> {
    try {
        // puppeteer.use(
        //     RecaptchaPlugin({
        //         provider: {
        //             id: '2captcha',
        //             token: process.env.API_2CAPTCHA
        //         },
        //         visualFeedback: true
        //     })
        // )

        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            headless: false,
            args: ['--start-maximized']
        // devtools: true,
        // executablePath: path.join('C:', 'Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe')
        })

        const { dateStartDown, dateEndDown, modelNF, situacaoNF, cgceCompanie, pageInicial, pageFinal } = settings
        settings.reprocessingFetchErrorsOrProcessing = !!(dateStartDown && dateEndDown)

        console.log('1- Abrindo nova página')
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })

        console.log('2- Fazendo loguin com certificado')
        await LoguinCertificado(page, browser, settings)

        console.log('3- Pegando relação de CNPS que este certificado tem acesso')
        const optionsCnpjs = await GetCnpjs(page, browser, settings)

        // Pega a URL atual pra não ter que abrir do zero o processo
        const urlActual = page.url()
        // const qtdEmpresas = 0

        // Percorre o array de empresas
        for (const option of optionsCnpjs) {
        // Esta linha analisa se é o cnpj esperado, nos casos de reprocessamento pra correção de erros
            if (cgceCompanie && option.value !== cgceCompanie) continue

            settings.cgceCompanie = option.value
            console.log(`4- Abrindo CNPJ ${option.label}`)

            for (const modelo of modelosNFe) {
            // Esta linha analisa se é o modelo de nota esperado, nos casos de reprocessamento pra correção de erros
                if (modelNF && modelo !== modelNF) continue
                settings.typeNF = typeNF(modelo)
                settings.modelNF = modelo

                console.log(`\t5- Buscando ${settings.typeNF}`)

                for (const situacao of situacaoNFs) {
                    if (situacaoNF && situacao !== situacaoNF) continue
                    settings.situacaoNF = situacao
                    settings.situacaoNFDescription = getDescriptionSituacaoNF(situacao)

                    console.log(`\t6- Buscando notas ${settings.situacaoNFDescription}`)

                    try {
                        // Pega o período necessário pra processamento
                        let periodToDown = null
                        if (!settings.reprocessingFetchErrorsOrProcessing) {
                            periodToDown = await PeriodToDownNFeGoias(page, settings)
                        } else {
                            periodToDown = {
                                dateStart: new Date(zonedTimeToUtc(dateStartDown, 'America/Sao_Paulo')),
                                dateEnd: new Date(zonedTimeToUtc(dateEndDown, 'America/Sao_Paulo'))
                            }
                        }
                        let year = periodToDown.dateStart.getFullYear()
                        const yearInicial = year
                        const yearFinal = periodToDown.dateEnd.getFullYear()
                        const monthInicial = periodToDown.dateStart.getMonth() + 1
                        const monthFinal = periodToDown.dateEnd.getMonth() + 1

                        while (year <= yearFinal) {
                            const months = functions.returnMonthsOfYear(year, monthInicial, yearInicial, monthFinal, yearFinal)

                            for (const month of months) {
                                const monthSring = functions.zeroLeft(month.toString(), 2)
                                console.log(`\t7- Iniciando processamento do mês ${monthSring}/${year}`)
                                //  clean settings to old don't affect new process
                                settings = cleanDataObject(settings, [], ['id', 'wayCertificate', 'hourLog', 'dateHourProcessing', 'nameCompanie', 'cgceCompanie', 'modelNF', 'situacaoNF', 'situacaoNFDescription', 'typeNF', 'typeLog', 'qtdTimesReprocessed', 'reprocessingFetchErrorsOrProcessing', 'pageInicial', 'pageFinal'])

                                try {
                                    const dateInicialAndFinalOfMonth = await SetDateInicialAndFinalOfMonth(page, settings, periodToDown, month, year)

                                    settings.dateStartDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(dateInicialAndFinalOfMonth.inicialDate, 'America/Sao_Paulo')))} 03:00:00 AM`
                                    settings.dateEndDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(dateInicialAndFinalOfMonth.finalDate, 'America/Sao_Paulo')))} 03:00:00 AM`
                                    settings.year = year
                                    settings.month = monthSring
                                    settings.entradasOrSaidas = 'Saidas'

                                    await ChecksIfFetchInCompetence(page, settings)

                                    console.log('\t8- Checando se é uma empresa válida pra este período.')
                                    settings = await CheckIfCompanieIsValid(page, settings)
                                    await page.goto(urlActual)

                                    console.log('\t9- Informando o CNPJ e período pra download.')
                                    await InputPeriodToDownload(page, settings)
                                    await ChangeCnpj(page, settings)

                                    console.log('\t10- Informando o modelo')
                                    await InputModeloToDownload(page, settings)

                                    console.log('\t11- Passando pelo Captcha')
                                    await GoesThroughCaptcha(page, settings)

                                    console.log('\t12- Verificando se há notas no filtro passado')
                                    await CheckIfSemResultados(page, settings)

                                    const qtdNotesGlobal = await GetQuantityNotes(page, settings)
                                    settings.qtdNotes = qtdNotesGlobal
                                    const qtdPagesDivPer100 = Math.trunc(qtdNotesGlobal / 100)
                                    const qtdPagesModPer100 = qtdNotesGlobal % 100
                                    settings.qtdPagesTotal = (qtdPagesDivPer100 >= 1 ? qtdPagesDivPer100 : 0) + (qtdPagesModPer100 >= 1 ? 1 : 0)
                                    settings.pageInicial = 1
                                    settings.pageFinal = settings.qtdPagesTotal <= 20 ? settings.qtdPagesTotal : 20
                                    let countWhilePages = 0

                                    while (true) {
                                        // console.log(settings)
                                        if (countWhilePages === 0 && pageInicial && pageFinal) {
                                            settings.pageInicial = pageInicial || settings.pageInicial
                                            settings.pageFinal = pageFinal || settings.pageFinal
                                        }

                                        console.log(`\t13- Clicando pra baixar arquivos - pag ${settings.pageInicial} a ${settings.pageFinal} de um total de ${settings.qtdPagesTotal}`)
                                        await ClickDownloadAll(page, settings)

                                        console.log('\t14- Clicando pra baixar dentro do modal')
                                        await ClickDownloadModal(page, settings)

                                        console.log(`\t15- Criando pasta pra salvar ${settings.qtdNotes} notas`)
                                        settings.typeLog = 'success' // update to sucess to create folder
                                        await CreateFolderToSaveXmls(page, settings)

                                        console.log('\t16- Checando se o download ainda está em progresso')
                                        await CheckIfDownloadInProgress(page, settings)

                                        console.log('\t17- Enviando informação que o arquivo foi baixado pra fila de salvar o processamento.')
                                        const pageDownload = await browser.newPage()
                                        await pageDownload.setViewport({ width: 0, height: 0 })
                                        await SendLastDownloadToQueue(pageDownload, settings)
                                        if (pageDownload) { await pageDownload.close() }

                                        settings.pageFinal = settings.pageFinal + 20
                                        settings.pageFinal = settings.pageFinal > settings.qtdPagesTotal ? settings.qtdPagesTotal : settings.pageFinal
                                        const varAuxiliar = settings.pageFinal - settings.pageInicial - 20
                                        settings.pageInicial = settings.pageFinal - varAuxiliar
                                        if (settings.pageInicial > settings.pageFinal) break // if pageInicial is > than pageFinal its because finish processing
                                        settings.typeLog = 'processing'

                                        countWhilePages += 1
                                    }
                                    console.log('\t18- Após processamento concluído, clicando em OK pra finalizar')
                                    await ClickOkDownloadFinish(page, settings)
                                    settings.pageInicial = 0
                                    settings.pageFinal = 0
                                    settings.qtdPagesTotal = 0
                                    settings.qtdNotes = 0

                                    console.log('\t[Final-Empresa-Mes]')
                                    console.log('\t-------------------------------------------------')
                                    // await CloseOnePage(page, 'Empresa')
                                } catch (error) { console.log(error) }
                            }
                            year++
                        }
                        // qtdEmpresas++
                        // if (qtdEmpresas === optionsCnpjs.length) {
                        //     if (browser.isConnected()) await browser.close()
                        // }
                    } catch (error) { console.log(error) }
                }
            }
        }
        console.log('[Final] - Todos os dados deste navegador foram processados, fechando navegador.')
        await browser.close()
    } catch (error) {

    }
}

// const hourLog = format(new Date(), 'yyyy-MM-dd hh:mm:ss a', { timeZone: 'America/Sao_Paulo' })
// MainNFGoias({ hourLog }).then(_ => console.log(_))