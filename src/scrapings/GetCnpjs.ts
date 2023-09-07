import { Page, Browser } from 'playwright'

import { ISettingsNFeGoias } from './_interfaces'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

interface IOptionsCnpjsGoias {
    value: string,
    label: string
}

export async function GetCnpjs (page: Page, browser: Browser, settings: ISettingsNFeGoias): Promise<IOptionsCnpjsGoias[]> {
    try {
        await page.waitForTimeout(1000)
        await page.waitForSelector('#cmpCnpj')
        const optionsCnpj = await page.evaluate(() => {
            const options: IOptionsCnpjsGoias[] = []
            const optionsAll = document.querySelectorAll('#cmpCnpj > option')
            optionsAll.forEach(value => {
                options.push({
                    label: value.textContent,
                    value: value.getAttribute('value')
                })
            })
            return options
        })
        if (optionsCnpj.length === 0) {
            throw 'DONT_EXIST_CNPJ_IN_SITE_NFE_FOR_THIS_CERTIFICATE'
        }
        return optionsCnpj
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'GetCnpjs'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao capturar lista de CNPJs'
        settings.pathFile = __filename

        if (error === 'DONT_EXIST_CNPJ_IN_SITE_NFE_FOR_THIS_CERTIFICATE') {
            settings.typeLog = 'warning'
            settings.messageError = 'DONT_EXIST_CNPJ_IN_SITE_NFE_FOR_THIS_CERTIFICATE'
            settings.messageLogToShowUser = 'Não existe nenhum CNPJ disponível na consulta do site de GO com esse certificado'
        }

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, browser, false)
        await treatsMessageLog.saveLog(true)
    }
}