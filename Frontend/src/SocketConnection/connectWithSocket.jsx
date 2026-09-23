import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { connectSocket, disconnectSocket } from './socket'

const useConnectWithSocket = () => {
    let {user} = useSelector(state => state.user)

  useEffect(() => {
    if (!user?._id) return 
    
    connectSocket(user?._id)

    return () => disconnectSocket()
  }, [user?._id])
}

export default useConnectWithSocket
