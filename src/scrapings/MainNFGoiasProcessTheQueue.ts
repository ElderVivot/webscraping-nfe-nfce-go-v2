import puppeteer from 'puppeteer'
import 'dotenv/config'

import { logger } from '@common/log'
import { saveLogDynamo } from '@services/dynamodb'

import { ISettingsNFeGoias } from './_interfaces'
import { ChangeCnpj } from './ChangeCnpj'
import { CheckIfDownloadInProgress } from './CheckIfDownloadInProgress'
import { CheckIfSemResultados } from './CheckIfSemResultados'
import { ChecksIfFetchInCompetence } from './ChecksIfFetchInCompetence'
import { ClickDownloadAll } from './ClickDownloadAll'
import { ClickDownloadModal } from './ClickDownloadModal'
import { CreateFolderToSaveXmls } from './CreateFolderToSaveXmls'
import { GetCnpjs } from './GetCnpjs'
import { GetQuantityNotes } from './GetQuantityNotes'
import { GoesThroughCaptcha } from './GoesThroughCaptcha'
import { InputModeloToDownload } from './InputModeloToDownload'
import { InputPeriodToDownload } from './InputPeriodToDownload'
import { LoguinCertificado } from './LoguinCertificado'
import { SendLastDownloadToQueue } from './SendLastDownloadToQueue'

export async function MainNFGoias (settings: ISettingsNFeGoias): Promise<void> {
    try {
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            headless: false,
            args: ['--start-maximized']
        })

        const { dateStartDown, dateEndDown, modelNotaFiscal, situationNotaFiscal, federalRegistration, pageInicial, pageFinal } = settings

        settings.nameStep = '1- Abrindo nova pagina'
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })

        settings.nameStep = '2- Fazendo loguin com certificado'
        await LoguinCertificado(page, browser, settings)

        const urlActual = page.url()

        settings.nameStep = '3- Checando se o CNPJ que esta sendo reprocessado eh o mesmo que esta setado no windows/regedit'
        const optionsCnpjs = await GetCnpjs(page, browser, settings)
        if (optionsCnpjs.filter(cnpj => cnpj.value === federalRegistration).length <= 0) {
            await browser.close()
            throw `CNPJ ${federalRegistration} not in list of cnpjs the certificate of windows/regedit ${optionsCnpjs}`
        }

        if (federalRegistration.length < 14) {
            await browser.close()
            throw `Dont CNPJ, is a CPF ${federalRegistration}`
        }

        settings.federalRegistration = federalRegistration
        settings.nameStep = `4- Iniciando processamento da empresa ${federalRegistration} - modelo ${modelNotaFiscal} - situacao ${situationNotaFiscal} - ${dateStartDown} a ${dateEndDown}`

        try {
            settings.dateStartDown = new Date(dateStartDown)
            settings.dateEndDown = new Date(dateEndDown)
            settings.year = settings.dateStartDown.getFullYear()
            settings.month = settings.dateStartDown.getMonth() + 1
            settings.entradasOrSaidas = 'Saidas'

            await ChecksIfFetchInCompetence(page, settings)

            await page.goto(urlActual)

            settings.nameStep = '6- Informando o CNPJ e periodo pra download.'
            await InputPeriodToDownload(page, settings)
            await ChangeCnpj(page, settings)

            settings.nameStep = '7- Informando o modelo'
            await InputModeloToDownload(page, settings)

            settings.nameStep = '8- Passando pelo Captcha'
            await GoesThroughCaptcha(page, settings)

            settings.nameStep = '9- Verificando se ha notas no filtro passado'
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
                if (countWhilePages === 0 && pageInicial && pageFinal) {
                    settings.pageInicial = pageInicial || settings.pageInicial
                    settings.pageFinal = pageFinal || settings.pageFinal
                }

                settings.nameStep = `10- Clicando pra baixar arquivos - pag ${settings.pageInicial} a ${settings.pageFinal} de um total de ${settings.qtdPagesTotal}`
                await ClickDownloadAll(page, settings)

                settings.nameStep = '11- Clicando pra baixar dentro do modal'
                await ClickDownloadModal(page, settings)

                settings.nameStep = `12- Criando pasta pra salvar ${settings.qtdNotes} notas`
                settings.typeLog = 'success' // update to sucess to create folder
                await CreateFolderToSaveXmls(page, settings)

                settings.nameStep = '13- Checando se o download ainda esta em progresso'
                await CheckIfDownloadInProgress(page, settings)

                settings.nameStep = '14- Enviando informacao que o arquivo foi baixado pra fila de salvar o processamento.'
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
            logger.info('-------------------------------------------------')
        } catch (error) {
            if (error.toString().indexOf('TreatsMessageLog') < 0) {
                logger.error(error)
                await saveLogDynamo({
                    messageError: error,
                    messageLog: 'MainNFGoiasProcessTheQueue',
                    pathFile: __filename,
                    typeLog: 'error'
                })
            }
        }
        logger.info('[Final] - Todos os dados deste navegador foram processados, fechando navegador.')
        if (browser) await browser.close()
    } catch (error) {
        logger.error(error)
        await saveLogDynamo({
            messageError: error,
            messageLog: 'MainNFGoiasProccessTheQueue',
            pathFile: __filename,
            typeLog: 'error'
        })
    }
}