import { set_organization, set_organization_loading } from '@/Redux_Store/organizationSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const get_all_organization = () => {
    let dispatch = useDispatch()
    let { selected_workspace } = useSelector((state) => state.workspace)

    useEffect(() => {
        if (!selected_workspace) {
            dispatch(set_organization([]))
            dispatch(set_organization_loading(false))
            return
        }

        let get_organization = async () => {
            try {
                dispatch(set_organization_loading(true))
                let res = await axios.get(`${import.meta.env.VITE_organization_endpoint}/get_all_organization/${selected_workspace}`, { withCredentials: true })

                if (res.data?.success) {
                    dispatch(set_organization(res.data.organizations || []))
                } else {
                    dispatch(set_organization([]))
                }
            } catch (error) {
                console.log(error)
                dispatch(set_organization([]))
            } finally {
                setTimeout(() => {dispatch(set_organization_loading(false))}, 500)
            }
        }

        get_organization()

    }, [selected_workspace, dispatch])
}

export default get_all_organization
