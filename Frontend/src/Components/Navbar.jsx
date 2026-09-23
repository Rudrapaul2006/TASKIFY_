import { FcGoogle } from "react-icons/fc";
import { VscThreeBars } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

const Navbar = () => {
    let navigate = useNavigate()

    return (
        <>
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

                    {/* Left side (signup or signin) for small device */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="md:hidden p-2 mt-2 rounded-full hover:bg-gray-100 active:scale-90 transition cursor-pointer">
                                <VscThreeBars className="text-2xl" />
                            </button>
                        </PopoverTrigger>

                        <PopoverContent className="w-48 p-4 mt-5 md:hidden">
                            <div className="flex flex-col gap-4">
                                <button onClick={() => navigate("/signin")} className="text-left font-semibold hover:underline cursor-pointer border border-blue-300 p-2 rounded-md active:scale-98">
                                    Log in
                                </button>
                                <button onClick={() => navigate("/signup")} className="text-left font-semibold border border-blue-300 p-2 rounded-md active:scale-98 text-[#2563EB] hover:underline cursor-pointer">
                                    Sign up
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Left side (signup or signin) for laptop / dekstop */}
                    <div className="hidden md:block">
                        <div className='flex gap-6'>
                            <button onClick={() => navigate("/signin")} className='text-md font-semibold hover:underline cursor-pointer'>Log in</button>
                            <button onClick={() => navigate('/signup')} className='flex items-center gap-2 px-3 py-1.5 text-sm text-white font-semibold bg-[#2563EB] border border-blue-600 rounded-md hover:bg-[#1D4ED8] cursor-pointer'> <span className="mt-0.5 px-1 py-1 bg-white rounded-lg"><FcGoogle /></span>Continue with google</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Navbar
