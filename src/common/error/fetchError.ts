import axios, { AxiosResponse } from 'axios'

export function handlesFetchError (error: any): AxiosResponse | undefined {
    if (axios.isAxiosError(error)) {
        return error.response?.data
    }
}