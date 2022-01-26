import axios from 'axios'

import { logger } from '@common/log'

export function handlesFetchError (error: any): void {
    if (axios.isAxiosError(error)) {
        logger.error({
            error: error.response?.data
        })
    }
}