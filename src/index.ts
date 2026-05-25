import express, { Request, Response } from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import cors from "cors"

dotenv.config()
const PORT = process.env.PORT
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get("/", (resp: Response) => {
    resp.send("Endpoint raiz de Backend")
})

app.listen(PORT, () => {
    console.log(`Se inicio servidor en http://localhost:${PORT}/`)
})