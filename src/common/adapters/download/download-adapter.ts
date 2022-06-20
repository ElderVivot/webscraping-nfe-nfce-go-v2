export interface IDownloadAdapter {
    download(): Promise<void>
}