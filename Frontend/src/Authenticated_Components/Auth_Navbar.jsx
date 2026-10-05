import { PopoverContent, Popover, PopoverTrigger } from '@/Components/ui/popover'
import { VscThreeBars } from "react-icons/vsc";
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CgProfile } from "react-icons/cg";
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { TbDotsFilled } from "react-icons/tb";
import axios from 'axios';
import toast from 'react-hot-toast';
import { setUser } from '@/Redux_Store/userSlice';
import { toggleTheme } from '@/Redux_Store/themeSlice';

const Auth_Navbar = () => {
    let navigate = useNavigate()
    let dispatch = useDispatch()
    let { user } = useSelector(state => state.user)

    //For theme change:
    let { theme } = useSelector(state => state.theme)

    let [active, setActive] = useState(false)
    let [lgactive, setLgActive] = useState(false)

    //Logout api 
    let userLogOut = async () => {
        try {
            let res = await axios.get(`${import.meta.env.VITE_user_endpoint}/logout`, { withCredentials: true })
            if (res.data.success) {
                toast.success(res.data.message)
                dispatch(setUser(null))
                navigate("/")
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Something went wrong")
        }
    }


    return (
        <div className='sticky top-0 z-[999]'>
            <div
                className={`border shadow-sm duration-300 ${theme === 'dark'
                    ? 'bg-[#1F1F21] text-slate-100 hover:bg-[#242427] hover:shadow-lg border border-[#3A3A3D] hover:border-[#545458]'
                    : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg'}`}
            >
                <div className='mx-2 lg:mx-20 px-2 h-18 flex flex-row items-center justify-between'>

                    {/* Logo side (left side) */}
                    <div onClick={() => navigate('/')} className={`flex items-center justify-center gap-3 font-bold text-3xl cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-[#172554]'}`}>
                        <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                            </div>
                        </div>
                        TaskiFy
                    </div>

                    {/* Left side account section for small device */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <button
                            onClick={() => dispatch(toggleTheme())}
                            className={`mt-0.5 flex items-center gap-4 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-300 ${theme === "dark" ?
                                "border-[#3A3A3D] bg-[#1F1F21] text-yellow-300 hover:border-[#545458] hover:bg-[#2A2A2D]" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <Popover onOpenChange={(open) => setActive(open)}>
                            <PopoverTrigger asChild>
                                <button
                                    className={`flex h-8 w-10 items-center justify-center rounded-md duration-300 ${active ? theme === "dark" ? "bg-emerald-500/25 text-emerald-300" : "bg-green-200 text-green-700" : theme === "dark" 
                                        ? "text-slate-200 hover:bg-[#2A2A2D]" : "text-slate-700 hover:bg-gray-200"}`}
                                >
                                    <TbDotsFilled size={20} />
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className={`mt-6 w-64 p-0 lg:hidden ${theme === "dark" ? "bg-[#2B2C2E] text-white" : "bg-white text-black"}`}>
                                <div className="p-3">
                                    <p className={`mb-3 text-xs font-semibold ${theme === "dark" ? "text-slate-400" : "text-gray-400"}`}>  ACCOUNT </p>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
                                            {user?.name && `${user.name.trim().split(/\s+/)[0][0]} ${user.name.trim().split(/\s+/).at(-1)[0]}`.toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>{user?.name || "null"}</p>
                                            <p className={`truncate text-sm ${theme === "dark" ? "text-white/30" : "text-gray-400"}`}>{user?.email || "null"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`border-t p-2 ${theme === "dark" ? "border-slate-700" : "border-gray-200"}`}>
                                    <button className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[15px] ${theme === "dark" ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}>
                                        <CgProfile size={20} /> <span>Profile</span>
                                    </button>

                                    <button onClick={userLogOut} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[15px] ${theme === "dark" ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}>
                                        <LogOut size={20} /> <span>Logout</span>
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Left side (signup or signin) for laptop / dekstop */}
                    <div className="hidden lg:flex items-center gap-3">
                        <button
                            onClick={() => dispatch(toggleTheme())}
                            className={`mt-1 mr-8 flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-300 ${theme === "dark" ? "border-[#3A3A3D] bg-[#1F1F21] text-yellow-300 hover:border-[#545458] hover:bg-[#2A2A2D]"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <Popover onOpenChange={(open) => setLgActive(open)}>
                            <PopoverTrigger>
                                <div
                                    onClick={() => setLgActive(!lgactive)}
                                    className={`flex h-12 w-12 items-center justify-center rounded-md duration-75 ${lgactive ? theme === "dark" ? "border border-blue-400 bg-blue-500/25 text-blue-200"
                                        : "border border-blue-400 bg-blue-200 text-blue-700" : theme === "dark" ? "border border-transparent text-slate-200 hover:border-[#545458] hover:bg-[#2A2A2D]"
                                        : "border border-transparent text-slate-700 hover:border-gray-300 hover:bg-gray-200"}`}
                                >
                                    {user?.avatar ? <img src={user.avatar} alt="Profile" className="h-10 w-10 rounded-full object-cover" /> :
                                        <User className={`h-10 w-10 rounded-full p-2 ${theme === "dark" ? "bg-emerald-500/20 text-emerald-300" : "bg-green-50 text-green-700"}`} />}
                                </div>
                            </PopoverTrigger>

                            <PopoverContent className={`mt-4 hidden w-72 p-0 lg:block ${theme === "dark" ? "bg-[#2B2C2E] text-white shadow-lg" : "bg-white text-black"}`}>
                                <div className={`border-b p-3 ${theme === "dark" ? "border-[#3A3A3D]" : "border-gray-200"}`}>
                                    <p className={`mb-3 text-xs font-semibold ${theme === "dark" ? "text-slate-400" : "text-gray-400"}`}>ACCOUNT</p>

                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                                            {user?.name && `${user.name.trim().split(/\s+/)[0][0]} ${user.name.trim().split(/\s+/).at(-1)[0]}`.toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}> {user?.name || "null"} </p>
                                            <p className={`truncate text-sm ${theme === "dark" ? "text-white/30" : "text-gray-400"}`}> {user?.email || "null"} </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2">
                                    <button className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left ${theme === "dark" ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}>
                                        <CgProfile size={21} /> <span className="text-[15px]">Profile</span>
                                    </button>

                                    <button onClick={userLogOut} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-500 ${theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}>
                                        <LogOut size={20} /> <span className="text-[15px]">Logout</span>
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Auth_Navbar
