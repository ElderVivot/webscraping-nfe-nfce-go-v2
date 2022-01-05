import ICompanies from 'src/models/ICompanies'

import api from '../services/api'

export default class GetCompanies {
    async getCompanies (filter: string): Promise<ICompanies[]> {
        try {
            const access = await api.get(`/companies${filter}`)
            if (access.status === 200) {
                return access.data
            }
            return []
        } catch (error) {
            console.log(`- [controllers_GetCompanies] --> Error --> ${error}`)
            return []
        }
    }
}

// const getPrefGoianiaAccess = new GetPrefGoianiaAccess()
// getPrefGoianiaAccess.getAccess().then(result => console.log(result))