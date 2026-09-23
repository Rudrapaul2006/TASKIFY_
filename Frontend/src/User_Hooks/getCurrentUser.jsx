import axios from 'axios'
import React, { useEffect } from 'react'
import { setUser, setUserLoading } from '../Redux_Store/userSlice'
import { useDispatch } from 'react-redux'

const getCurrentUser = () => {
    let dispatch = useDispatch();

    useEffect(() => {
        let currentUser = async () => {
            try {
                dispatch(setUserLoading(true))
                let res = await axios.get(`${import.meta.env.VITE_user_endpoint}/profile`, { withCredentials: true })

                if (res.data.success) {
                    dispatch(setUser(res.data.user))
                } else {
                    dispatch(setUser(null))
                }
            } catch (error) {
                console.log(error)
                dispatch(setUser(null))
            } finally {
                dispatch(setUserLoading(false))
            }
        }

        currentUser()
    }, [dispatch])
}

export default getCurrentUser
