import api from '../services/apiLicenseClient'

export default class GetClientLicense {
    async getAccess (): Promise<any> {
        try {
            const access = await api.get('/acesso?acao=BuscarNotas')
            if (access.status === 200) {
                return access.data
            }
        } catch (error) {
            console.log(`- [controllers_GetClientLicense] --> Error --> ${error}`)
        }
    }
}

// const getClientLicense = new GetClientLicense()
// getClientLicense.getAccess().then(result => console.log(result))