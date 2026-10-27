import { configureStore } from '@reduxjs/toolkit'
import userSlice from './userSlice'
import themeSlice from './themeSlice'
import workspaceSlice from './workspaceSlice'

export let store = configureStore({
    reducer: {
        user: userSlice,
        theme: themeSlice,
        workspace: workspaceSlice
    }
})