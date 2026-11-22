import { createSlice, current } from "@reduxjs/toolkit"


let workspaceSlice = createSlice({
    name: "workspace",

    initialState: {
        workspace: [], // [all users workspace data stored here] [owner / member]
        workspaceLoading: false,
        hasFetchedWorkspaces: false,

        // selected workspace :
        selected_workspace: typeof window !== "undefined" ? window.localStorage.getItem("selectedWorkspaceId") : null,

        workspace_activity: [],
        workspace_activity_loading: false,

        workspaceMembers: [], // all workspace_members data stored here [owner / member]
        workspaceMembersLoading: false,
        workspaceMembersCount: 0, // each workspace_members count
        workspace_member_search: '',
        workspace_member_sorting: '',


        //workspace invitation [pending invitation] [owner side]
        workspace_invitations: [], // pending invitations 
        workspace_invitations_loading: false,
        pending_invitation_search: '',
        pending_invitation_sorting: '',


        //workspace join request [pending join request] [owner side]
        workspace_join_request: [],
        workspace_join_request_loading: false,
        pending_join_request_search: '',
        pending_join_request_sort: '',


        // all type invitation activity  [cancel, declined and expire invitation data] [owner side]
        workspace_type_invitations: [],
        workspace_type_invitations_loading: false,
        type_invitation_search: '', //for search by name and email 
        type_invitation: '', // types - cancelled, declined and expire invitation 
        type_invitation_sorting: '', //sort


        // all type join request [cancel, declined and expired join_request data] [owner side]
        workspace_type_join_request: [],
        workspace_type_join_request_loding: false,
        type_join_request_search: '',
        type_join_request_sort: '',



        // user side :
        user_join_requests: [], // user send join req to other workspace , that request stored here
        user_join_request_loading: false,

        search_user_join_request: '',
        sort_user_join_request: '',



        // user [declined, expired, cancelled ] join request stored here :
        user_type_join_request: [],
        user_type_join_request_loading: false,

        // search_user_type_join_request: '',
        // sort_user_type_join_request: '' 

    },

    reducers: {
        setWorkspace: (state, action) => {
            state.workspace = action.payload || []
            state.hasFetchedWorkspaces = true
        },
        setWorkspaceLoading: (state, action) => {
            state.workspaceLoading = action.payload
        },


        // selected workspace id 
        set_selected_workspace: (state, action) => {
            state.selected_workspace = action.payload

            if (action.payload) {
                localStorage.setItem("selectedWorkspaceId", action.payload)
            } else {
                localStorage.removeItem("selectedWorkspaceId")
            }
        },

        // add workspace :
        setAddWorkspace: (state, action) => {
            state.workspace.push(action.payload)
            state.hasFetchedWorkspaces = true
        },
        update_workspace_data: (state, action) => {
            let targetId = (action.payload?._id || action.payload?.id)?.toString()
            if (!targetId || !state.workspace) return

            state.workspace = state.workspace.map((ws) => {
                let wsId = (ws.workspace?._id || ws._id)?.toString()
                if (wsId === targetId) {
                    if (ws.workspace) {
                        return { ...ws, workspace: { ...ws.workspace, ...action.payload } }
                    }
                    return { ...ws, ...action.payload }
                }
                return ws
            })
        },



        // workspace activity :
        set_workspace_activity: (state, action) => {
            state.workspace_activity = action.payload
        },
        set_workspace_activity_loading: (state, action) => {
            state.workspace_activity_loading = action.payload
        },



        // Total member's in workspace : [owner / member]
        setWorkspaceMembers: (state, action) => {
            state.workspaceMembers = action.payload
        },
        setWorkspaceMembersLoading: (state, action) => {
            state.workspaceMembersLoading = action.payload
        },
        setWorkspaceMembersCount: (state, action) => {
            state.workspaceMembersCount = action.payload
        },


        set_workspace_member_search: (state, action) => {
            state.workspace_member_search = action.payload
        },
        set_workspace_member_sorting: (state, action) => {
            state.workspace_member_sorting = action.payload
        },




        // workspace invitations [owner side]
        set_workspace_invitations: (state, action) => {
            state.workspace_invitations = action.payload || []
        },
        set_workspace_invitations_loading: (state, action) => {
            state.workspace_invitations_loading = action.payload
        },

        set_add_invitation: (state, action) => {
            state.workspace_invitations.unshift(action.payload)
        },
        decline_invitation: (state, action) => {
            state.workspace_invitations = state.workspace_invitations.filter(req => req?._id !== action.payload?._id)
        },


        set_pending_invitation_search: (state, action) => {
            state.pending_invitation_search = action.payload
        },
        set_pending_invitation_sorting: (state, action) => {
            state.pending_invitation_sorting = action.payload
        },





        // workspace join request : [owner side]
        set_workspace_join_request: (state, action) => {
            state.workspace_join_request = action.payload || []
        },
        set_workspace_join_request_loading: (state, action) => {
            state.workspace_join_request_loading = action.payload
        }, //set_add_invitation

        accept_join_request: (state, action) => {
            state.workspace_join_request = state.workspace_join_request.filter((req) => req?._id !== action.payload?._id)
        },
        decline_join_request: (state, action) => {
            state.workspace_join_request = state.workspace_join_request.filter((req) => req?._id !== action.payload?._id)
        },

        set_pending_join_request_search: (state, action) => {
            state.pending_join_request_search = action.payload
        },
        set_pending_join_request_sort: (state, action) => {
            state.pending_join_request_sort = action.payload
        },




        // type invitations [owner side]
        set_workspace_type_invitations: (state, action) => {
            state.workspace_type_invitations = action.payload || []
        },
        set_workspace_type_invitations_loading: (state, action) => {
            state.workspace_type_invitations_loading = action.payload
        },
        set_resend_workspace_invitation: (state, action) => { // re-send karne ke bad [workspace_type_invitations => type invitation ki array] invitation ko array se  nikal deta ha
            let payloadEmail = (action?.payload?.invitedEmail || '')?.trim().toLowerCase() // [workspace_type_invitations => store cancelled, declined and expired invitations]
            let payloadUserId = (action?.payload?.invitedUser?._id || '')?.toString()

            state.workspace_type_invitations = state.workspace_type_invitations.filter(inv => {
                let invEmail = (inv?.invitedEmail || inv?.invitedUser?.email || '')?.trim().toLowerCase()
                let invUserId = (inv?.invitedUser?._id || inv?.invitedUser)?.toString()

                let isMatch = ((payloadEmail && invEmail) && (payloadEmail === invEmail)) ||
                    ((payloadUserId && invUserId) && (payloadUserId === invUserId))

                return !isMatch
            })
        },


        set_type_invitation_search: (state, action) => { // types - cancelled, declined and expire invitation 
            state.type_invitation_search = action.payload
        },
        set_type_invitation: (state, action) => { // to search by name and email
            state.type_invitation = action.payload
        },
        set_type_invitation_sorting: (state, action) => { // sort
            state.type_invitation_sorting = action.payload
        },



        // type join requests [owner side]
        set_workspace_type_join_request: (state, action) => {
            state.workspace_type_join_request = action.payload
        },
        set_workspace_type_join_request_loding: (state, action) => {
            state.workspace_type_join_request_loding = action.payload
        },
        set_type_join_request_search: (state, action) => {
            state.type_join_request_search = action.payload
        },
        set_type_join_request_sort: (state, action) => {
            state.type_join_request_sort = action.payload
        },



        // user side reducers
        set_user_join_requests: (state, action) => {
            state.user_join_requests = action.payload
        },
        set_user_join_request_loading: (state, action) => {
            state.user_join_request_loading = action.payload
        },

        set_search_user_join_request: (state, action) => {
            state.search_user_join_request = action.payload
        },
        set_sort_user_join_request: (state, action) => {
            state.sort_user_join_request = action.payload
        },

        cancel_user_join_request: (state, action) => {
            state.user_join_requests = state.user_join_requests.filter(req => req?._id !== action.payload?._id)
        },





        // type join request [user side] [declined, expired and cancelled join request]
        set_user_type_join_request: (state, action) => {
            state.user_type_join_request = action.payload
        },
        set_user_type_join_request_loading: (state, action) => {
            state.user_type_join_request_loading = action.payload
        },


        resend_user_join_request: (state, action) => {
            if (!action?.payload) return
            let ws_id = action.payload.workspace?._id.toString()

            state.user_type_join_request = state.user_type_join_request.filter(req => {
                let target_ws_id = req?.workspace?._id

                let isMatch = (target_ws_id && ws_id && target_ws_id === ws_id)

                return !isMatch
            })

        }
    }
})

export let { setWorkspace, setWorkspaceLoading, setAddWorkspace, set_selected_workspace, update_workspace_data,
    set_workspace_activity, set_workspace_activity_loading,
    setWorkspaceMembers, setWorkspaceMembersLoading, setWorkspaceMembersCount, set_workspace_member_search, set_workspace_member_sorting,
    set_workspace_invitations, set_workspace_invitations_loading, set_add_invitation, decline_invitation, set_pending_invitation_search, set_pending_invitation_sorting,
    set_type_invitation, set_type_invitation_search, set_type_invitation_sorting, set_resend_workspace_invitation,
    set_workspace_join_request, set_workspace_join_request_loading, accept_join_request, decline_join_request, set_pending_join_request_search, set_pending_join_request_sort,
    set_workspace_type_invitations, set_workspace_type_invitations_loading,
    set_workspace_type_join_request, set_workspace_type_join_request_loding,
    set_type_join_request_search, set_type_join_request_sort,


    // user side reducers : 
    set_user_join_requests, set_user_join_request_loading, set_search_user_join_request, set_sort_user_join_request, cancel_user_join_request,
    set_user_type_join_request, set_user_type_join_request_loading, resend_user_join_request
} = workspaceSlice.actions
export default workspaceSlice.reducer