import jwt from 'jsonwebtoken'
import userModel from '../Models/user.model.js'


export let connectIo = async (io) => {
    // Handle socket connection (Middlewere for io connection) : [no unauthenticated user can connect with socket]
    io.use(async (socket, next) => {
        let token = socket.handshake.headers?.cookie?.split("; ").find(cookie => cookie.startsWith("token="))?.split("=")[1] || socket.handshake.auth?.token
        
        if (!token) {
            return next(new Error('Authentication error'))
        }

        let decoded = jwt.verify(token, process.env.JWT_SECRET)
        let user = await userModel.findById(decoded.id)

        if (!user) {
            return next(new Error('Authentication error'))
        }

        socket.user = user
        socket.userId = user._id.toString()

        next()
    })

    io.on('connection', (socket) => {
        socket.on('join', async (userId) => {
            let user = await userModel.findById(userId)

            user.socketId = socket.id
            user.online = true
            await user.save()
            
            // console.log(`User ${user?.name} connected with socket id: ${socket.id}`)
        }) 

        socket.on('disconnect', () => {
            try {
                setTimeout(async () => {
                    let user = await userModel.findById(socket.userId)
                    if (!user) return

                    if (user.socketId === socket.id) {
                        user.socketId = null
                        user.online = false
                        await user.save()

                        // console.log(`User ${user.name} disconnected`)
                    }
                }, 3000)
            } catch (error) {
                console.log(error)
            }
        })
    })
}