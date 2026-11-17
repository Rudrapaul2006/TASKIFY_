import { set_organization, set_organization_loading } from '@/Redux_Store/organizationSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const get_all_organization = () => {
    let dispatch = useDispatch()
    let workspace_id = typeof window !== "undefined" ? localStorage.getItem("selectedWorkspaceId") : null

    useEffect(() => {
        if (!workspace_id) return

        let get_organization = async () => {
            try {
                dispatch(set_organization_loading(true))
                let res = await axios.get(`${import.meta.env.VITE_organization_endpoint}/get_all_organization/${workspace_id}` , {withCredentials: true})

                if (res.data.success){
                    dispatch(set_organization(res.data.organizations))
                } 
            } catch (error) {
                console.log(error)
            } finally {
                dispatch(set_organization_loading(false))
            }
        }

        get_organization()

    }, [workspace_id, dispatch])
}

export default get_all_organization
