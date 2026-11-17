import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { connectSocket, disconnectSocket } from './socket'

const useConnectWithSocket = () => {
  let { user } = useSelector(state => state.user)

  // Initialize socket before child components render so getSocket() is never null
  if (user?._id) {
    connectSocket(user?._id)
  }

  useEffect(() => {
    if (!user?._id) return

    connectSocket(user?._id)

    return () => disconnectSocket()
  }, [user?._id])
}

export default useConnectWithSocket
