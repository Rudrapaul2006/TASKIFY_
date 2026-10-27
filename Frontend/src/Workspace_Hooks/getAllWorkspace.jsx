import { setWorkspace, setWorkspaceLoading } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const getAllWorkspace = () => {
    let dispatch = useDispatch()
    let { user } = useSelector((state) => state.user)

    useEffect(() => {
        if (!user?._id) return

        let getWorkspaces = async () => {
            try {
                dispatch(setWorkspaceLoading(true))
                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/getall`, { withCredentials: true })

                if (res.data.success) {
                    dispatch(setWorkspace(res.data.workspaces || []))
                } else {
                    dispatch(setWorkspace([]))
                }
            } catch (error) {
                console.log(error)
                dispatch(setWorkspace([]))
            } finally {
                dispatch(setWorkspaceLoading(false))
            }
        }

        getWorkspaces()

    }, [dispatch, user?._id])
}

export default getAllWorkspace
