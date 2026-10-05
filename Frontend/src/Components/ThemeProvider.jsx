import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

const ThemeProvider = ({ children }) => {
    let { theme } = useSelector(state => state.theme)

    useEffect(() => {
        let root = document.documentElement

        if (theme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }

    }, [theme])

    return (
        <div className={theme === "dark" ? "min-h-screen bg-[#1F1F21] text-white" : "min-h-screen bg-white text-gray-900"}>
            {children}
        </div>
    )
}

export default ThemeProvider
