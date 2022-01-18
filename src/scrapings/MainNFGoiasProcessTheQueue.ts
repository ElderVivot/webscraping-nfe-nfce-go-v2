import { zonedTimeToUtc } from 'date-fns-tz'
import puppeteer from 'puppeteer'
import 'dotenv/config'

import * as functions from '../../utils/functions'
import { ISettingsNFeGoias } from './_ISettingsNFeGoias'
import { ChangeCnpj } from './ChangeCnpj'
import { CheckIfCompanieIsValid } from './CheckIfCompanieIsValid'
import { CheckIfDownloadInProgress } from './CheckIfDownloadInProgress'
import { CheckIfSemResultados } from './CheckIfSemResultados'
import { ChecksIfFetchInCompetence } from './ChecksIfFetchInCompetence'
import { ClickDownloadAll } from './ClickDownloadAll'
import { ClickDownloadModal } from './ClickDownloadModal'
import { ClickOkDownloadFinish } from './ClickOkDownloadFinish'
import { CreateFolderToSaveXmls } from './CreateFolderToSaveXmls'
import { GetQuantityNotes } from './GetQuantityNotes'
import { GoesThroughCaptcha } from './GoesThroughCaptcha'
import { InputModeloToDownload } from './InputModeloToDownload'
import { InputPeriodToDownload } from './InputPeriodToDownload'
import { LoguinCertificado } from './LoguinCertificado'
import { SendLastDownloadToQueue } from './SendLastDownloadToQueue'

function getDescriptionSituacaoNF (situacao: string): string {
    if (situacao === '2') return 'Autorizadas'
    else if (situacao === '3') return 'Canceladas'
    else return 'DESCONHECIDO'
}

export async function MainNFGoias (settings: ISettingsNFeGoias = {}): Promise<void> {
    try {
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            headless: false,
            args: ['--start-maximized']
        })

        const { dateStartDown, dateEndDown, modelNF, situacaoNF, cgceCompanie, pageInicial, pageFinal } = settings

        console.log('1- Abrindo nova página')
        const page = await browser.newPage()
        await page.setViewport({ width: 0, height: 0 })

        console.log('2- Fazendo loguin com certificado')
        await LoguinCertificado(page, browser, settings)

        // Pega a URL atual pra não ter que abrir do zero o processo
        const urlActual = page.url()

        settings.cgceCompanie = cgceCompanie
        console.log(`4- Abrindo CNPJ ${cgceCompanie}`)

        settings.modelNF = modelNF
        console.log(`5- Buscando ${settings.modelNF}`)

        settings.situacaoNF = situacaoNF
        settings.situacaoNFDescription = getDescriptionSituacaoNF(situacaoNF)
        console.log(`6- Buscando notas ${settings.situacaoNFDescription}`)

        try {
            const periodToDown = {
                dateStart: new Date(zonedTimeToUtc(dateStartDown, 'America/Sao_Paulo')),
                dateEnd: new Date(zonedTimeToUtc(dateEndDown, 'America/Sao_Paulo'))
            }

            console.log(`\t7- Iniciando processamento do mês ${periodToDown.dateStart} - ${periodToDown.dateEnd}`)
            settings.dateStartDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(periodToDown.dateStart, 'America/Sao_Paulo')))} 03:00:00 AM`
            settings.dateEndDown = `${functions.convertDateToString(new Date(zonedTimeToUtc(periodToDown.dateEnd, 'America/Sao_Paulo')))} 03:00:00 AM`
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

            console.log('\t[Final-Empresa-Mes]')
            console.log('\t-------------------------------------------------')
        } catch (error) { console.log(error) }
        console.log('[Final] - Todos os dados deste navegador foram processados, fechando navegador.')
        await browser.close()
    } catch (error) {

    }
}