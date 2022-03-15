import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { IFetchAdapter } from './fetch-adapter'

export class FetchImplementation implements IFetchAdapter {
    async get<IData = any> (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>> {
        return await axios.get<IData>(url, config)
    }

    async post<IData = any> (url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>> {
        return await axios.post<IData>(url, data, config)
    }

    async put<IData = any> (url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>> {
        return await axios.put<IData>(url, data, config)
    }

    async patch<IData = any> (url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<IData>> {
        return await axios.patch<IData>(url, data, config)
    }
}