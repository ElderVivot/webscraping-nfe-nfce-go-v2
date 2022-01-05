import axios from 'axios'
import 'dotenv/config'

const ip = process.env.API_HOST || 'localhost'
const port = Number(process.env.API_PORT) || 3330

const api = axios.create({
    baseURL: `http://${ip}:${port}`
})

export default api