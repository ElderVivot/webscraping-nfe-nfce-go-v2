import { Page, Browser } from 'puppeteer'

import { ISettingsNFeGoias } from './_interfaces'
import { IOptionsCnpjsGoias } from './IOptionsCnpjsGoias'
import { TreatsMessageLogNFeGoias } from './TreatsMessageLogNFGoias'

export async function GetCnpjs (page: Page, browser: Browser, settings: ISettingsNFeGoias): Promise<IOptionsCnpjsGoias[]> {
    try {
        await page.waitForTimeout(1000)
        await page.waitForSelector('#cmpCnpj')
        return await page.evaluate(() => {
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
    } catch (error) {
        settings.typeLog = 'error'
        settings.messageLog = 'GetCnpjs'
        settings.messageError = error
        settings.messageLogToShowUser = 'Erro ao capturar lista de CNPJs'
        settings.pathFile = __filename

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, browser)
        // dont save in database because dont have information necessary to reprocess
        await treatsMessageLog.saveLog(false)
    }
}