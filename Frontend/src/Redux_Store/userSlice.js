import { createSlice } from "@reduxjs/toolkit";


let userSlice = createSlice({
    name: "user",
    initialState: {
        user: null,
        isAuthenticated: false,
        userLoading: false
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        setUserLoading: (state, action) => {
            state.userLoading = action.payload;
        }
    }
})

export let { setUser, setUserLoading } = userSlice.actions
export default userSlice.reducer