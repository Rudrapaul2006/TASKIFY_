import { set_workspace_type_join_request, set_workspace_type_join_request_loding } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'

const get_all_type_join_request = (workspace_id) => {
    let dispatch = useDispatch()
    let { type_join_request_search, type_join_request_sort } = useSelector(state => state.workspace)

    useEffect(() => {
        if(!workspace_id) return

        // get canceled and declined user's join request's :
        let get_type_joinreq = async () => {
            try {
                dispatch(set_workspace_type_join_request_loding(true))

                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/type_joining_requests/${workspace_id}?search=${type_join_request_search}&sort=${type_join_request_sort}`, {withCredentials: true})

                if (res.data.success){
                    dispatch(set_workspace_type_join_request(res.data.userJoinReq))
                }
            } catch (error) {
                console.log(error);
                toast.error(error?.response?.data?.message || 'something error in get type join req')
            } finally {
                dispatch(set_workspace_type_join_request_loding(false))
            }
        }

        get_type_joinreq()

    }, [dispatch, workspace_id, type_join_request_search, type_join_request_sort])

}

export default get_all_type_join_request
