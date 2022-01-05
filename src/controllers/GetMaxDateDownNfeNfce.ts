import api from '../services/api'

export interface IMaxDateDownNfeNfce {
    datedownmax: String
}

export default class GetMaxDateDownNfeNfce {
    async getMaxDateDown (filter: string): Promise<IMaxDateDownNfeNfce | any> {
        try {
            const access = await api.get(`/log_nfe_nfce_go_max_date_down${filter}`)
            if (access.status === 200) {
                return access.data
            }
        } catch (error) {
            console.log(`- [controllers-GetMaxDateDownNfeNfce] --> Error --> ${error}`)
        }
    }
}

// const getPrefGoianiaAccess = new GetPrefGoianiaAccess()
// getPrefGoianiaAccess.getAccess().then(result => console.log(result))