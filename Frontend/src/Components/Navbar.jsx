import { FcGoogle } from "react-icons/fc";
import { VscThreeBars } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../Redux_Store/themeSlice";
import { Moon, Sun } from "lucide-react";

const Navbar = () => {
    let navigate = useNavigate()
    let dispatch = useDispatch()
    let { theme } = useSelector(state => state.theme)

    return (
        <>
            <div className={`border shadow-sm duration-300 ${theme === "dark"
                ? "border-[#3A3A3D] bg-[#1F1F21] text-slate-100 hover:border-[#545458] hover:bg-[#2A2A2D] hover:shadow-lg"
                : "border-[#E5E7EB] bg-[#FAFAFA] text-slate-900 hover:bg-white hover:shadow-lg"}`}>
                <div className='mx-2 lg:mx-20 px-2 h-18 flex flex-row items-center justify-between'>

                    {/* Logo */}
                    <div
                        onClick={() => navigate('/')}
                        className={`flex items-center justify-center gap-3 font-bold text-3xl cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-[#172554]'}`}
                    >
                        <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                            </div>
                        </div>
                        TaskiFy
                    </div>

                    {/* Right side — mobile */}
                    <div className="mt-0.5 flex items-center justify-center gap-2 md:hidden">
                        {/* Theme toggle — mobile */}
                        <button
                            onClick={() => dispatch(toggleTheme())}
                            className={`mt-2 flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all duration-300 ${theme === "dark"
                                ? "border-[#3A3A3D] bg-[#1F1F21] text-yellow-300 hover:border-[#545458] hover:bg-[#2A2A2D]"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <button className={`mt-2 cursor-pointer rounded-full p-2 transition active:scale-90 ${theme === "dark" ? "text-slate-200 hover:bg-[#2A2A2D]" : "text-slate-700 hover:bg-gray-100"}`}>
                                    <VscThreeBars className="text-2xl" />
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className={`mt-5 w-48 p-4 md:hidden ${theme === "dark" ? "border border-[#3A3A3D] bg-[#1F1F21] text-white" : "border border-gray-200 bg-white text-black"}`}>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => navigate("/signin")}
                                        className={`cursor-pointer rounded-md border p-2 text-left font-semibold transition active:scale-95 hover:underline ${theme === "dark" ? "border-[#3A3A3D] text-slate-200 hover:border-[#545458] hover:bg-[#2A2A2D]" : "border-blue-300 text-slate-700 hover:bg-blue-50"}`}
                                    >
                                        Log in
                                    </button>

                                    <button
                                        onClick={() => navigate("/signup")}
                                        className={`cursor-pointer rounded-md border p-2 text-left font-semibold text-[#2563EB] transition active:scale-95 hover:underline ${theme === "dark" ? "border-blue-500 hover:bg-blue-500/10" : "border-blue-300 hover:bg-blue-50"}`}
                                    >
                                        Sign up
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Right side — desktop */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Theme toggle — desktop */}
                        <button
                            onClick={() => dispatch(toggleTheme())}
                            className={`mt-1 mr-10 flex items-center gap-5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-300 ${theme === "dark"
                                ? "border-[#3A3A3D] bg-[#1F1F21] text-yellow-300 hover:border-[#545458] hover:bg-[#2A2A2D]"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <button
                            onClick={() => navigate("/signin")}
                            className={`text-md font-semibold hover:underline cursor-pointer transition ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className='flex items-center gap-2 px-3 py-1.5 text-sm text-white font-semibold bg-[#2563EB] border border-blue-600 rounded-md hover:bg-[#1D4ED8] cursor-pointer transition'
                        >
                            <span className="mt-0.5 px-1 py-1 bg-white rounded-lg"><FcGoogle /></span>
                            Continue with Google
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Navbar
