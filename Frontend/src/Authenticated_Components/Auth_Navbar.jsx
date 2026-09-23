import { PopoverContent, Popover, PopoverTrigger } from '@/Components/ui/popover'
import { VscThreeBars } from "react-icons/vsc";
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CgProfile } from "react-icons/cg";
import { LogOut, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { TbDotsFilled } from "react-icons/tb";
import axios from 'axios';
import toast from 'react-hot-toast';
import { setUser } from '@/Redux_Store/userSlice';

const Auth_Navbar = () => {
    let navigate = useNavigate()
    let dispatch = useDispatch()
    let { user } = useSelector(state => state.user)

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
            <div className='border border-t shadow-sm border-[#E5E7EB] bg-[#FAFAFA] hover:bg-[#FFFFFF] hover:shadow-lg  duration-300'>
                <div className='mx-2 lg:mx-20 px-2 h-18 flex flex-row items-center justify-between'>

                    {/* Logo side (right side) */}
                    <div onClick={() => navigate('/')} className='flex  items-center justify-center  gap-3 text-[#172554] font-bold text-3xl cursor-pointer'>
                        <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                            </div>
                        </div>
                        TaskiFy
                    </div>

                    {/* Left side account section for small device */}
                    <Popover onOpenChange={(open) => setActive(open)} >
                        <PopoverTrigger className="" asChild>
                            <div onClick={() => setActive(!active)} className={`flex lg:hidden md:hidden items-center justify-center w-10 h-8 rounded-md duration-300 cursor-pointer ${active ? "bg-green-200" : "hover:bg-gray-200"}`}>
                                <TbDotsFilled size={20} />
                            </div>
                        </PopoverTrigger>

                        <PopoverContent className="mt-6 max-w-[250px] block lg:hidden md:hidden">
                            <div className="p-2 border-b border-gray-700">
                                <p className="text-xs font-semibold text-gray-400 mb-3">ACCOUNT</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9.5 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-semibold">
                                        {user?.name && `${user.name.trim().split(/\s+/)[0][0]} ${user.name.trim().split(/\s+/).at(-1)[0]}`.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate"> {user?.name || "null"}</p>
                                        <p className="text-sm text-gray-400 truncate">{user?.email || "null"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                <button className="flex items-center gap-2 w-full text-md text-left px-3 py-2 rounded-md hover:bg-gray-200">
                                    <span><CgProfile size={20} /></span> <span className='text-[15px]'>Profile</span>
                                </button>
                                <button className=" flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-red-400 hover:bg-gray-200">
                                    <span className='mt-1'><LogOut size={20} /></span> <span className='text-[15px]'>Logout</span>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Left side (signup or signin) for laptop / dekstop */}
                    <div className="hidden md:block">
                        <Popover onOpenChange={(open) => setLgActive(open)}>
                            <PopoverTrigger>
                                <div onClick={() => setLgActive(!lgactive)} className={`hidden sm:hidden md:flex lg:flex items-center justify-center w-12 h-12 rounded-md duration-75 ${lgactive ? "bg-blue-200 border border-blue-400" : "hover:bg-gray-200 hover:border border-gray-300"}`}>
                                    {user?.avatar ? <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" /> : <User className="w-10 h-10 p-2 rounded-full bg-green-50" />}
                                </div>
                            </PopoverTrigger>

                            <PopoverContent className="mt-4 hidden md:flex">
                                <div className="p-2 border-b border-gray-700">
                                    <p className="text-xs font-semibold text-gray-400 mb-3">ACCOUNT</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center font-semibold">
                                            {user?.name && `${user.name.trim().split(/\s+/)[0][0]} ${user.name.trim().split(/\s+/).at(-1)[0]}`.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold truncate"> {user?.name || "null"}</p>
                                            <p className="text-sm text-gray-400 truncate">{user?.email || "null"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <button className="flex items-center gap-2 w-full text-md text-left px-3 py-2 rounded-md hover:bg-gray-200">
                                        <span><CgProfile size={21} /></span> <span className='text-[15px]'>Profile</span>
                                    </button>
                                    <button onClick={userLogOut} className=" flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-red-500 hover:bg-gray-200">
                                        <span className='mt-1'><LogOut size={20} /></span> <span className='text-[15px]'>Logout</span>
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
