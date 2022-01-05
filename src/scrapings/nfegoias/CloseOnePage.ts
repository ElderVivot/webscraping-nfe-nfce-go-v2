import { Page } from 'puppeteer'

export async function CloseOnePage (page: Page, type: string = 'Empresa'): Promise<void> {
    try {
        await page.close()
        if (type === 'Empresa') {
            console.log('\t[Final-Empresa] - Fechando aba')
            console.log('\t-------------------------------------------------')
        } else {
            console.log(`\t\t[Final-${type}] - Fechando aba`)
            console.log('\t\t-------------------------------------------------')
        }
    } catch (error) {
        console.log(error)
    }
}