import puppeteer from 'puppeteer'
import 'dotenv/config'

import { logger } from '@common/log'

import { ISettingsNFeGoias } from './_interfaces'
import { ChangeCnpj } from './ChangeCnpj'
import { CheckIfCompanieIsValid } from './CheckIfCompanieIsValid'
import { CheckIfDownloadInProgress } from './CheckIfDownloadInProgress'
import { CheckIfSemResultados } from './CheckIfSemResultados'
import { ChecksIfFetchInCompetence } from './ChecksIfFetchInCompetence'
import { ClickDownloadAll } from './ClickDownloadAll'
import { ClickDownloadModal } from './ClickDownloadModal'
// import { ClickOkDownloadFinish } from './ClickOkDownloadFinish'
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

        logger.info('1- Abrindo nova pagina')
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })

        logger.info('2- Fazendo loguin com certificado')
        await LoguinCertificado(page, browser, settings)

        const urlActual = page.url()

        logger.info('3- Checando se o CNPJ que esta sendo reprocessado eh o mesmo que esta setado no windows/regedit')
        const optionsCnpjs = await GetCnpjs(page, browser, settings)
        if (optionsCnpjs.filter(cnpj => cnpj.value).length <= 0) {
            throw `CNPJ ${federalRegistration} not in list of cnpjs the certificate of windows/regedit ${optionsCnpjs}`
        }

        settings.federalRegistration = federalRegistration
        logger.info(`4- Iniciando processamento da empresa ${federalRegistration} - modelo ${modelNotaFiscal} - situacao ${situationNotaFiscal} - ${dateStartDown} a ${dateEndDown}`)

        try {
            settings.dateStartDown = new Date(dateStartDown)
            settings.dateEndDown = new Date(dateEndDown)
            settings.year = settings.dateStartDown.getFullYear()
            settings.month = settings.dateStartDown.getMonth() + 1
            settings.entradasOrSaidas = 'Saidas'

            await ChecksIfFetchInCompetence(page, settings)

            logger.info('5- Checando se e uma empresa valida pra este periodo.')
            settings = await CheckIfCompanieIsValid(page, settings)
            await page.goto(urlActual)

            logger.info('6- Informando o CNPJ e periodo pra download.')
            await InputPeriodToDownload(page, settings)
            await ChangeCnpj(page, settings)

            logger.info('7- Informando o modelo')
            await InputModeloToDownload(page, settings)

            logger.info('8- Passando pelo Captcha')
            await GoesThroughCaptcha(page, settings)

            logger.info('9- Verificando se ha notas no filtro passado')
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

                logger.info(`10- Clicando pra baixar arquivos - pag ${settings.pageInicial} a ${settings.pageFinal} de um total de ${settings.qtdPagesTotal}`)
                await ClickDownloadAll(page, settings)

                logger.info('11- Clicando pra baixar dentro do modal')
                await ClickDownloadModal(page, settings)

                logger.info(`12- Criando pasta pra salvar ${settings.qtdNotes} notas`)
                settings.typeLog = 'success' // update to sucess to create folder
                await CreateFolderToSaveXmls(page, settings)

                logger.info('13- Checando se o download ainda esta em progresso')
                await CheckIfDownloadInProgress(page, settings)

                logger.info('14- Enviando informacao que o arquivo foi baixado pra fila de salvar o processamento.')
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
        } catch (error) { if (settings.typeLog === 'error') logger.error(error) }
        logger.info('[Final] - Todos os dados deste navegador foram processados, fechando navegador.')
        if (browser) await browser.close()
    } catch (error) { logger.error(error) }
}