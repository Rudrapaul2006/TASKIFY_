import jwt from 'jsonwebtoken'
import userModel from '../Models/user.model.js'
import { workspaceMemberShip } from '../Models/workspace.model.js'
import mongoose from 'mongoose'
import chalk from 'chalk'


export let connectIo = async (io) => {

    // Keep socket IDs shared across all connections so one tab disconnecting
    // does not mark the user offline while another tab is still connected.
    let userSocketMap = new Map()


    // Handle socket connection (Middlewere for sequre io connection) : [no unauthenticated user can connect with socket io]
    io.use(async (socket, next) => {

        let token = socket.handshake.headers?.cookie?.split("; ").find(cookie => cookie.startsWith("token="))?.split("=")[1] || socket.handshake.auth?.token

        if (!token) { return next(new Error('Authentication error')) }

        let decoded = jwt.verify(token, process.env.JWT_SECRET)
        let user = await userModel.findById(decoded.id)

        if (!user) { return next(new Error('Authentication error')) }

        socket.user = user
        socket.userId = user?._id.toString()

        next()
    })


    io.on('connection', (socket) => {

        // Count the socket immediately, on refresh, the new socket may connect by user
        if (!userSocketMap.has(socket.userId)) {
            userSocketMap.set(socket.userId, new Set())
        }

        userSocketMap.get(socket.userId).add(socket.id)

        // user connection : [user connected to his specific user room]
        socket.on('join', async (userId) => {
            if (!userId || userId !== socket.userId || !mongoose.Types.ObjectId.isValid(userId)) return

            // console.log(chalk.green(`Tab opened: [${[...userSocketMap.get(userId)].join(", ")}] || User: ${socket.user?.name} || Tab count: ${userSocketMap.get(userId).size}`))

            // personal room — sirf isi user ke sab tabs/devices ismein honge
            await socket.join(`user_${userId}`)

            await userModel.findByIdAndUpdate(userId, { online: true }, { new: true })
            // console.log(`User ${socket.user?.name} connected with socket id: ${socket.id}`)
        })


        // connected online user join to his workspace room's :
        socket.on('join_socket_room', async (workspace_id) => {
            try {
                if (typeof workspace_id !== 'string' || !workspace_id.trim() || !mongoose.Types.ObjectId.isValid(workspace_id)) return

                let membership = await workspaceMemberShip.findOne({ user: socket.userId, workspace: workspace_id }).populate("workspace", "name")

                if (!membership) {
                    console.log(chalk.red(`User ${socket.user?.name} is not a member of workspace with id - [${workspace_id}]`))
                    return
                }

                // console.log(chalk.green(`User ${socket.user?.name} joined workspace room - [${membership.workspace.name}] with id - [${workspace_id}]`))

                await socket.join(`workspace_${workspace_id}`) // Join the workspace room
            }
            catch (error) {
                console.log(error)
            }
        })


        // user disconnected
        socket.on('disconnect', () => {
            try {
                let userId = socket.userId
                let sockets = userSocketMap.get(userId)
                if (!sockets) return

                sockets.delete(socket.id)
                let sizeAfterClose = sockets.size

                if (sizeAfterClose === 0) userSocketMap.delete(userId)

                setTimeout(async () => {
                    try {
                        // read new socket id after refresh and increase tab size if user open new tab 
                        let current = userSocketMap.get(userId)
                        let currentSize = current ? current.size : 0

                        // pehle se zyada sockets hain => naya socket join hua => refresh tha
                        if (currentSize > sizeAfterClose) return

                        // if realy user close the tab:
                        // console.log(chalk.yellow(`Tab closed: ${socket.id} | user: ${socket.user?.name} | remaining: ${currentSize} | [${current ? [...current].join(", ") : ""}]`))

                        // no tab is open => user set to offline
                        if (currentSize === 0) {
                            await userModel.findByIdAndUpdate(userId, { online: false })
                            // console.log(chalk.red(`User ${socket.user?.name} set offline`))
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }, 3000)

            } catch (error) {
                console.log(error)
            }
        })
    })
}