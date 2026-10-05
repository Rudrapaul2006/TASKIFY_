import { createSlice } from "@reduxjs/toolkit";

const savedTheme = localStorage.getItem("theme") || "light";

let themeSlice = createSlice({
    name: "theme",
    initialState: {
        theme: savedTheme
    },
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem("theme", state.theme)
        }
    }
})

export let { toggleTheme } = themeSlice.actions
export default themeSlice.reducer