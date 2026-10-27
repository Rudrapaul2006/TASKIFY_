import { set_workspace_type_invitations, set_workspace_type_invitations_loading } from "@/Redux_Store/workspaceSlice"
import axios from "axios"
import { useEffect } from "react"
import toast from "react-hot-toast"
import { useDispatch, useSelector } from "react-redux"

export let get_all_type_invitations = (workspace_id) => {
    let dispatch = useDispatch()
    let {type_invitation} = useSelector(state => state.workspace)

    useEffect(() => {
        if (!workspace_id) return

        let fetchInvitations = async () => {
            try {
                dispatch(set_workspace_type_invitations_loading(true)) 
                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/history_and_invitation_activity/${workspace_id}?type=${type_invitation}`, { withCredentials: true })

                if (res.data.success){
                    dispatch(set_workspace_type_invitations(res?.data?.invitation))          
                } else {
                    dispatch(set_workspace_type_invitations([]))
                }
            } catch (error) {
                console.log(error)
                toast.error(error?.response?.data?.message || 'something error in get invitations')
            } finally {
                dispatch(set_workspace_type_invitations_loading(false))
            }
        }

        fetchInvitations()

    }, [workspace_id, dispatch, type_invitation])
}