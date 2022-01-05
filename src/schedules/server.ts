import app from './app'
import 'dotenv/config'

const port = Number(process.env.SERVER_PORT) || 3337
app.listen(port, () => console.log(`Executing Server Schedule in port ${port} !`))