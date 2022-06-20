import http from 'http'

export interface IDownloaderConfig {
    url:string
    directory?:string
    fileName?:string
    cloneFiles?:boolean
    skipExistingFileName?:boolean
    timeout?:number
    maxAttempts?:number
    headers?:object
    httpsAgent?:any
    proxy?:string
    onError?(e:Error):void
    onResponse?(r:http.IncomingMessage):boolean|void
    onBeforeSave?(finalName:string):string|void
    onProgress?(percentage:string, chunk:object, remaningSize:number):void
    shouldStop?(e:Error):boolean|void
    shouldBufferResponse?:boolean
    useSynchronousMode?:boolean
}