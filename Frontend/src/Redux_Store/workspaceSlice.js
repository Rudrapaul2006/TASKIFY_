import { createSlice } from "@reduxjs/toolkit"


let workspaceSlice = createSlice({
    name: "workspace",

    initialState: {
        workspace: [],
        workspaceLoading: false,
        hasFetchedWorkspaces: false,

        workspaceMembers: [], // all workspace_members data stored here
        workspaceMembersLoading: false,
        workspaceMembersCount: 0, // each workspace_members count
        workspace_member_search: '',
        workspace_member_sorting: '',


        //workspace invitation
        workspace_invitations: [], // pending invitations 
        workspace_invitations_loading: false,
        pending_invitation_search: '',
        pending_invitation_sorting: '',


        //workspace join request
        workspace_join_request: [],
        workspace_join_request_loading: false,
        pending_join_request_search: '',
        pending_join_request_sort: '',


        // all type invitation activity  [cancel, declined and expire invitation data]
        workspace_type_invitations: [], 
        workspace_type_invitations_loading: false,
        type_invitation_search: '', //for search by name and email 
        type_invitation: '', // types - cancelled, declined and expire invitation 
        type_invitation_sorting: '', //sort


        // all type join request [cancel, declined and expired join_request data]
        workspace_type_join_request: [],
        workspace_type_join_request_loding: false,
        type_join_request_search: '',
        type_join_request_sort: '',
    }, 

    reducers: { 
        setWorkspace: (state, action) => {
            state.workspace = action.payload || []
            state.hasFetchedWorkspaces = true
        },
        setWorkspaceLoading: (state, action) => {
            state.workspaceLoading = action.payload
        },

        // add workspace :
        setAddWorkspace: (state, action) => {
            state.workspace.push(action.payload)
            state.hasFetchedWorkspaces = true
        },




        // Total member's in workspace : 
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




        // workspace invitations
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


        

        
        // workspace join request :
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
        set_pending_join_request_sort : (state, action) => {
            state.pending_join_request_sort = action.payload
        },




        // type invitations
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
        
        
        set_type_invitation_search : (state, action) => { // types - cancelled, declined and expire invitation 
            state.type_invitation_search = action.payload
        },
        set_type_invitation : (state, action) => { // to search by name and email
            state.type_invitation = action.payload
        },
        set_type_invitation_sorting : (state, action) => { // sort
            state.type_invitation_sorting = action.payload
        },




        // type join requests
        set_workspace_type_join_request : (state, action) => {
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
    }
})

export let { setWorkspace, setWorkspaceLoading, setAddWorkspace,
    setWorkspaceMembers, setWorkspaceMembersLoading, setWorkspaceMembersCount, set_workspace_member_search, set_workspace_member_sorting,
    set_workspace_invitations, set_workspace_invitations_loading, set_add_invitation, decline_invitation, set_pending_invitation_search, set_pending_invitation_sorting, 
    set_type_invitation, set_type_invitation_search, set_type_invitation_sorting, set_resend_workspace_invitation,
    set_workspace_join_request, set_workspace_join_request_loading, accept_join_request, decline_join_request, set_pending_join_request_search, set_pending_join_request_sort,
    set_workspace_type_invitations, set_workspace_type_invitations_loading, 
    set_workspace_type_join_request, set_workspace_type_join_request_loding,
    set_type_join_request_search, set_type_join_request_sort
} = workspaceSlice.actions
export default workspaceSlice.reducer