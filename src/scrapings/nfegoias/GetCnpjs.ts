import { Page, Browser } from 'puppeteer'

import { IOptionsCnpjsGoias } from './IOptionsCnpjsGoias'
import { ISettingsNFeGoias } from './ISettingsNFeGoias'
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
        console.log(`[Final] - ${settings.messageLogToShowUser}`)
        console.log('-------------------------------------------------')

        const treatsMessageLog = new TreatsMessageLogNFeGoias(page, settings, browser)
        // dont save in database because dont have information necessary to reprocess
        await treatsMessageLog.saveLog(false)
    }
}