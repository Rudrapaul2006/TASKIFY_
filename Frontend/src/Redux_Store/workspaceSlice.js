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

        workspace_invitations: [], // pending invitations 
        workspace_invitations_loading: false,
        pending_invitation_search: '',
        pending_invitation_sorting: '',

        type_invitation: '', //for search all type invitation [cancel, declined and expire]

        workspace_join_request: [],
        workspace_join_request_loading: false,

        workspace_type_invitations: [], //store cancelled, declined, expired invitation data
        workspace_type_invitations_loading: false,
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


        set_type_invitation : (state, action) => { // to search all type of invitations
            state.type_invitation = action.payload
        },

        
        // workspace join request :
        set_workspace_join_request: (state, action) => {
            state.workspace_join_request = action.payload || []
        },
        set_workspace_join_request_loading: (state, action) => {
            state.workspace_join_request_loading = action.payload
        },

        accept_join_request: (state, action) => {
            state.workspace_join_request = state.workspace_join_request.filter((req) => req?._id !== action.payload?._id)
        },
        decline_join_request: (state, action) => {
            state.workspace_join_request = state.workspace_join_request.filter((req) => req?._id !== action.payload?._id)
        },


        // type invitations
        set_workspace_type_invitations: (state, action) => {
            state.workspace_type_invitations = action.payload || []
        },
        set_workspace_type_invitations_loading: (state, action) => {
            state.workspace_type_invitations_loading = action.payload
        },
    }
})

export let { setWorkspace, setWorkspaceLoading, setAddWorkspace,
    setWorkspaceMembers, setWorkspaceMembersLoading, setWorkspaceMembersCount, set_workspace_member_search, set_workspace_member_sorting,
    set_workspace_invitations, set_workspace_invitations_loading, set_add_invitation, decline_invitation, set_pending_invitation_search, set_pending_invitation_sorting, set_type_invitation,
    set_workspace_join_request, set_workspace_join_request_loading, accept_join_request, decline_join_request,
    set_workspace_type_invitations, set_workspace_type_invitations_loading
} = workspaceSlice.actions
export default workspaceSlice.reducer