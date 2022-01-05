import { Page } from 'puppeteer'

const checkIfLoadedThePage = async (pageOrFrame: Page, selector: string, isAFrame = false): Promise<boolean> => {
    const searchSelectorAlreadyExists = async (timeout = 0) => {
        await pageOrFrame.waitFor(timeout * 1000)
        let result = false
        try {
            if (isAFrame === false) {
                const fieldIsValid = await pageOrFrame.evaluate(selectorFilter => document.querySelector(selectorFilter), selector)
                if (fieldIsValid) {
                    result = true
                } else {
                    result = false
                }
            } else {
                const fieldIsValid = pageOrFrame.frames().find(frame => frame.name() === selector)
                if (fieldIsValid) {
                    result = true
                } else {
                    result = false
                }
            }
        } catch (error) {
            result = false
        }
        return result
    }

    let countTry = 1
    let resultSearchSelector = await searchSelectorAlreadyExists()
    while (resultSearchSelector === false && countTry <= 10) {
        countTry += 1
        resultSearchSelector = await searchSelectorAlreadyExists(countTry)
        // tenta 10 vezes, se na 10° não tiver dado certo então para
        if (resultSearchSelector === false && countTry === 10) {
            return false
        }
    }
    return true
}

export default checkIfLoadedThePage