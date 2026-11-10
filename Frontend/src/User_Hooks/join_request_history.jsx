import { set_user_type_join_request, set_user_type_join_request_loading } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const join_request_history = () => {

    let dispatch = useDispatch()
    let { user } = useSelector(state => state.user)

    if (!user?._id) {return} 

    useEffect(() => {
        let get_user_join_request_history = async () => {
            try {
                dispatch(set_user_type_join_request_loading(true))
                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/user_type_join_request`, { withCredentials: true })

                if (res.data.success) {
                    dispatch(set_user_type_join_request(res.data.userJoinReq))
                }
            } catch (error) {
                console.log(error)
            } finally {
                dispatch(set_user_type_join_request_loading(false))
            }
        }

        get_user_join_request_history()

    }, [user?._id, dispatch])
}

export default join_request_history
