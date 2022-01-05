export function promiseTimeOut (tempo: number): Promise<string> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve('TIME_EXCEED')
        }, tempo)
    })
}