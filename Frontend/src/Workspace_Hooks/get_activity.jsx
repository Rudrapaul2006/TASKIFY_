import { set_workspace_activity, set_workspace_activity_loading } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const get_activity = (workspaceId) => {
    let dispatch = useDispatch()
    let { selected_workspace } = useSelector(state => state.workspace)

    let activeWsId = workspaceId || selected_workspace

    let get_workspace_activity = useCallback(async (silent = false) => {

        if (!activeWsId) {
            dispatch(set_workspace_activity([]))
            return
        }

        try {
            if (!silent) dispatch(set_workspace_activity_loading(true))

            let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/activity/${activeWsId}`, { withCredentials: true })

            if (res.data.success) {
                dispatch(set_workspace_activity(res.data.activities))
            }
        } catch (error) {
            console.log(error)
        } finally {
            if (!silent) setTimeout(() => { dispatch(set_workspace_activity_loading(false)) }, 300)
        }
    }, [dispatch, activeWsId])


    useEffect(() => {
        get_workspace_activity()
    }, [get_workspace_activity])

    return get_workspace_activity
}

export default get_activity
