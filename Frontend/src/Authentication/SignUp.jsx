import { FcGoogle } from "react-icons/fc";
import { IoMdArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useDispatch, useSelector } from 'react-redux'
import { app } from "../Firebase/Firebase";
import axios from 'axios'
import toast from 'react-hot-toast'
import { setUser, setUserLoading } from "../Redux_Store/userSlice";

const SignUp = () => {
    let navigate = useNavigate()
    let dispatch = useDispatch()
    let { theme } = useSelector(state => state.theme)

    //Google SignUp :
    let googleSignUp = async () => {
        try {
            dispatch(setUserLoading(true))

            let provider = new GoogleAuthProvider()
            let auth = getAuth(app)

            let googleData = await signInWithPopup(auth, provider)

            let res = await axios.post(`${import.meta.env.VITE_user_endpoint}/register`, { email: googleData.user.email, name: googleData.user.displayName, avatar: googleData.user.photoURL }, { withCredentials: true })
            if (res.data.success) {
                toast.success(res.data.message || `Registration Successful`)
                dispatch(setUser(res.data.user))
                navigate("/authenticatedhome")
            }

        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Something went wrong")
        } finally {
            dispatch(setUserLoading(false))
        }
    }

    return (
        <>
            {/* Back Button */}
            <div className={`mx-4 py-5 lg:mx-20 lg:py-10 ${theme === "dark" ? "bg-[#1F1F21]" : "bg-white"}`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`cursor-pointer rounded-full p-2 transition duration-300 active:scale-95 ${theme === "dark" ? "bg-[#1F1F21] text-slate-200 hover:bg-[#2A2A2D]" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                >
                    <IoMdArrowBack size={22} />
                </button>
            </div>

            {/* Signup Section */}
            <div className={`flex min-h-[72vh] items-center justify-center px-4 ${theme === "dark" ? "bg-[#1F1F21]" : "bg-white"}`}>
                <div className={`w-full max-w-[520px] rounded-md border px-10 py-10 shadow-md transition duration-300 hover:shadow-lg ${theme === "dark"
                    ? "border-[#3A3A3D] bg-[#1F1F21] hover:border-[#545458] hover:bg-[#2A2A2D]" : "border-gray-100 bg-white hover:bg-gray-50"}`}>

                    {/* Logo */}
                    <div className="flex justify-center items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                            </div>
                        </div>

                        <h1 className={`text-5xl font-semibold ${theme === "dark" ? "text-white" : "text-[#172B4D]"}`}>
                            Taskify
                        </h1>
                    </div>


                    <h2 className={`mb-8 text-center text-xl font-semibold ${theme === "dark" ? "text-slate-200" : "text-[#172B4D]"}`}>
                        Sign up to continue
                    </h2>

                    <button
                        onClick={googleSignUp}
                        className={`flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-md border font-semibold transition duration-200 active:scale-[0.98] ${theme === "dark"
                            ? "border-[#3A3A3D] bg-[#1F1F21] text-slate-200 hover:border-[#545458] hover:bg-[#2A2A2D]"
                            : "border-gray-300 bg-white text-[#172B4D] hover:bg-gray-50"}`}
                    >
                        <FcGoogle className="text-2xl" /> Sign up with Google
                    </button>

                    <div className="flex items-center gap-3 my-7">
                        <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>OR</span>
                        <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                    </div>

                    {/* Sign In link */}
                    <p className={`text-center text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                        Have an account?{" "}
                        <button
                            onClick={() => navigate("/signin")}
                            className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
                        >
                            Sign in
                        </button>
                    </p>

                </div>
            </div>
        </>
    )
}

export default SignUp
