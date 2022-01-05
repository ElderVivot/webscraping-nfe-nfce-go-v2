import api from '../services/api'

interface ILogFetchCompetence {
    cgceCompanie: string,
    modelNF: string,
    dateStartDown: string,
    dateEndDown: string
}

export default class GetLogFetchCompetence {
    async show (filter: string): Promise<ILogFetchCompetence | any> {
        try {
            const access = await api.get(`/log_nfe_nfce_go_fetch_competence${filter}`)
            return access.data
        } catch (error) {
            console.log(`- [controllers-GetLogFetchCompetence] --> Error --> ${error}`)
        }
    }
}

// const getPrefGoianiaAccess = new GetPrefGoianiaAccess()
// getPrefGoianiaAccess.getAccess().then(result => console.log(result))