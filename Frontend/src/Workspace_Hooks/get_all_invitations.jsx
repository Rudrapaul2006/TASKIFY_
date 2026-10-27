import { set_workspace_invitations, set_workspace_invitations_loading } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export const get_invitation = (workspace_id) => {

    let dispatch = useDispatch()
    let {pending_invitation_search, pending_invitation_sorting} = useSelector(state => state.workspace)

    useEffect(() => {
        if (!workspace_id) {
            dispatch(set_workspace_invitations([]))
            return
        }

        let get_all_invitations = async () => {
            try {
                dispatch(set_workspace_invitations_loading(true))

                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/get_sended_invitations/${workspace_id}?query=${pending_invitation_search}&sort=${pending_invitation_sorting}`, { withCredentials: true })

                if (res.data.success) {
                    dispatch(set_workspace_invitations(res.data.invitation))
                } else {
                    dispatch(set_workspace_invitations([]))
                }
            } catch (error) {
                console.error(error)
            } finally {
                dispatch(set_workspace_invitations_loading(false))
            }
        }

        get_all_invitations()

    }, [workspace_id, dispatch, pending_invitation_search, pending_invitation_sorting])
}