import http from 'http'
import Downloader from 'nodejs-file-downloader'

import { IDownloadAdapter } from './download-adapter'

export interface IDownloaderConfig{
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

export class DownloadImplementation implements IDownloadAdapter {
    private downloader: Downloader
    constructor (config: IDownloaderConfig) {
        this.downloader = new Downloader(config)
    }

    async download (): Promise<void> {
        await this.downloader.download()
    }
}