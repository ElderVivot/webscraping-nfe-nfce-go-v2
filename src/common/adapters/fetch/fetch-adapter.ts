import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface IFetchAdapter {
    get<IData = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>>
    post<IData = any>(url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>>
    put<IData = any>(url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>>
    patch<IData = any>(url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>>
}