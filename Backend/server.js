import express from 'express'
import dotenv from 'dotenv'
import chalk from 'chalk'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

import UserRouter from './Routes/user.route.js'
import { DBConnection } from './Utils/ConnectDB.js'
import { connectIo } from './Utils/Socket.js'
import WorkspaceRouter from './Routes/workspace.route.js'
import OrganizationRouter from './Routes/organization.route.js'
import { redisClient } from './Utils/RedisClint.js'


dotenv.config()

let app = express()
let server = createServer(app)
let io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}))


app.get('/', (req, res) => {
    res.send("Taskify Backend")
})

// app.use('/uploads', express.static('uploads'))
let __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// userRoute's
app.use('/api/user', UserRouter)
app.use('/api/workspace', WorkspaceRouter)
app.use('/api/organization', OrganizationRouter)

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Route not found",
    })
})

let port = process.env.PORT || 5000

// Socket io connection :
connectIo(io)

server.listen(port, () => {
    DBConnection()
    redisClient  // connect redis client
    console.log(chalk.blue(`Server is running on port ${chalk.green(port)}`))
})