import { set_workspace_join_request, set_workspace_join_request_loading } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const get_all_join_request = (workspace_id) => {
    let dispatch = useDispatch()

    useEffect(() => {
        if (!workspace_id) {
            dispatch(set_workspace_join_request([]))
            return
        }

        let get_join_req = async () => {
            try {
                dispatch(set_workspace_join_request_loading(true))
                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/get_pending_join_request/${workspace_id}`, { withCredentials: true })

                if (res.data.success) {
                    dispatch(set_workspace_join_request(res.data.pendingRequests))
                    // console.log(res.data.pendingRequests)
                    
                } else {
                    dispatch(set_workspace_join_request([]))
                }
            } catch (error) {
                console.log(error)
            } finally {
                dispatch(set_workspace_join_request_loading(false))
            }
        }

        get_join_req()

    }, [workspace_id, dispatch])
}

export default get_all_join_request
