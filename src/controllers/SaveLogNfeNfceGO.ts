import ILogNfeNfceGO from '../models/ILogNfeNfceGO'
import api from '../services/api'

export default class SaveLogNfeNfceGO {
    async saveLog (logNfeNfceGO: ILogNfeNfceGO): Promise<any> {
        try {
            const { id } = logNfeNfceGO
            let result
            if (id) {
                result = await api.put(`/log_nfe_nfce_go/${id}`, { ...logNfeNfceGO })
            } else {
                result = await api.post('/log_nfe_nfce_go', { ...logNfeNfceGO })
            }
            if (result.status === 200) {
                return result
            }
        } catch (error) {
            console.log(`- [controllers_SaveLogNfeNfceGo] --> Error --> ${error}`)
        }
    }
}