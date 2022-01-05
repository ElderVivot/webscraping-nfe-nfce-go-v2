import api from '../services/api'

interface IMaxDateDownNfeNfce {
    datedownmax: String
}

export default class GetMaxDateDownNfeNfcePerMonth {
    async show (filter: string): Promise<IMaxDateDownNfeNfce | any> {
        try {
            const access = await api.get(`/log_nfe_nfce_go_max_date_down_per_month${filter}`)
            if (access.status === 200) {
                return access.data
            }
        } catch (error) {
            console.log(`- [controllers-GetMaxDateDownNfeNfcePerMonth] --> Error --> ${error}`)
        }
    }
}

// const getPrefGoianiaAccess = new GetPrefGoianiaAccess()
// getPrefGoianiaAccess.getAccess().then(result => console.log(result))