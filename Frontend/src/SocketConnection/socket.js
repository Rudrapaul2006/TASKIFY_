import {io} from 'socket.io-client'

// let socket = io(import.meta.env.VITE_Server_url)

let socket = null 

export let connectSocket = (userId) => {
    if(!socket) {
        socket = io(import.meta.env.VITE_Server_url, { withCredentials: true})

        socket.on('connect', () => {
            socket.emit('join', userId)
        })

    } 

    return socket
}

export let getSocket = () => socket

export let disconnectSocket = () => {
    if (socket){
        socket.disconnect()
        socket = null
    }
}
