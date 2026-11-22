import { createSlice } from "@reduxjs/toolkit";


let organizationSlice = createSlice({
    name: 'organization',

    initialState: {
        organization: [],
        organization_loading: false,

        selected_org: typeof window !== "undefined" ? window.localStorage.getItem("selected_org_id") : null
    },

    reducers: {
        set_organization: (state, action) => {
            state.organization = action.payload
        },
        set_organization_loading: (state, action) => {
            state.organization_loading = action.payload
        },

        add_organization: (state, action) => {
            state.organization.push(action.payload)
        },

        set_selected_org: (state, action) => {
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
    add_organization, set_selected_org
} = organizationSlice.actions
export let Add_Organization = add_organization
export default organizationSlice.reducer