import { createSlice } from "@reduxjs/toolkit";


let organizationSlice = createSlice({
    name: 'organization',

    initialState: {
        organization: [],
        organization_loading: false,

        selected_org: typeof window !== "undefined" ? window.localStorage.getItem("selected_org_id") : null,
    },

    reducers: {
        set_organization: (state, action) => {
            state.organization = action.payload
        },
        set_organization_loading: (state, action) => {
            state.organization_loading = action.payload
        },

        Add_Organization: (state, action) => {
            state.organization.push(action.payload)
        },

        selected_org_id: (state, action) => { // Selected org id: set in Add_Organization, read in Sidebar (Redux + localStorage) 
            state.selected_org = action.payload  

            if (action.payload) {
                localStorage.setItem("selected_org_id", action.payload)
            } else {
                localStorage.removeItem("selected_org_id")
            }
        }
    }
})

export let {
    set_organization, set_organization_loading,
    Add_Organization, selected_org_id
} = organizationSlice.actions
export default organizationSlice.reducer