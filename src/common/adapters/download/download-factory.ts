import { IDownloadAdapter } from './download-adapter'
import { DownloadImplementation, IDownloaderConfig } from './download-implementation'

export function makeDownloadImplementation (config: IDownloaderConfig): IDownloadAdapter {
    return new DownloadImplementation(config)
}