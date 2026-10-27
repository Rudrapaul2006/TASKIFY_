import { createSlice } from "@reduxjs/toolkit";


let userSlice = createSlice({
    name: "user",
    initialState: {
        user: null,
        isAuthenticated: false,
        userLoading: true
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        setUserLoading: (state, action) => {
            state.userLoading = action.payload;
        },

        // update user :
        setUpdateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload }
        }
    }
})

export let { setUser, setUserLoading, setUpdateUser } = userSlice.actions
export default userSlice.reducer