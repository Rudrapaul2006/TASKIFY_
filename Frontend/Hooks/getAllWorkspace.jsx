import { setWorkspace, setWorkspaceLoading } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const getAllWorkspace = () => {
    let dispatch = useDispatch()
    let navigate = useNavigate()

    let { user } = useSelector((state) => state.user)

    // user workspace's
    useEffect(() => {
        let fetchWorkspaces = async () => {

            if (!user?._id) return
            dispatch(setWorkspaceLoading(true))

            try {
                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/getall`, { withCredentials: true })
                if (res.data.success && res.data.workspaces && res.data.workspaces.length > 0) {
                    dispatch(setWorkspace(res.data.workspaces))  
                } else {
                    dispatch(setWorkspace([]))
                }
            } catch (error) {
                console.log(error)
                dispatch(setWorkspace([]))
                toast.error(error?.response?.data?.message || "Failed to load workspaces")
            } finally {
                dispatch(setWorkspaceLoading(false))
            }
        }

        fetchWorkspaces()
    }, [user?._id , dispatch])

}

export default getAllWorkspace
