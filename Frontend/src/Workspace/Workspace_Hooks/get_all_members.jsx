import { setWorkspaceMembers, setWorkspaceMembersCount, setWorkspaceMembersLoading } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const get_all_members = (workspace_id, active_tab) => {
    let dispatch = useDispatch()
    let validTabs = ['members', 'invitation', 'joinRequest'] // active tabs [member page]

    let {workspace_member_search, workspace_member_sorting} = useSelector(state => state.workspace)

    useEffect(() => {
        if (!workspace_id || !validTabs.includes(active_tab)) return
        let ignore = false

        let get_members = async () => {
            try {
                dispatch(setWorkspaceMembersLoading(true))

                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/get_all_members/${workspace_id}?query=${workspace_member_search}&sort=${workspace_member_sorting}`, { withCredentials: true })

                if (!ignore && res.data.success) {
                    dispatch(setWorkspaceMembers(res.data.allMembers))
                    dispatch(setWorkspaceMembersCount(res.data.membersCount))
                }
            } catch (error) {
                console.log(error)
            } finally {
                dispatch(setWorkspaceMembersLoading(false))
            }
        }

        get_members()
        
    }, [dispatch, workspace_id, active_tab, workspace_member_search, workspace_member_sorting])
}

export default get_all_members
