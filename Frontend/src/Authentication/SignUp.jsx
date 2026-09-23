import { FcGoogle } from "react-icons/fc";
import { IoMdArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {useDispatch} from 'react-redux'
import { app } from "../Firebase/Firebase";
import axios from 'axios'
import toast from 'react-hot-toast'
import { setUser, setUserLoading } from "../Redux_Store/userSlice";

const SignUp = () => {
    let navigate = useNavigate()
    let dispatch = useDispatch()

    //Google SignUp :
    let googleSignUp = async () => {
        try {
            dispatch(setUserLoading(true))

            let provider = new GoogleAuthProvider()
            let auth = getAuth(app)

            let googleData = await signInWithPopup(auth, provider)           

            let res = await axios.post(`${import.meta.env.VITE_user_endpoint}/register` , {email: googleData.user.email, name : googleData.user.displayName, avatar: googleData.user.photoURL} , {withCredentials: true})
            if (res.data.success){
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
            <div className="mx-4 lg:mx-20 py-5 lg:py-10 bg-white">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full
                     active:scale-95 transition duration-300 cursor-pointer"
                >
                    <IoMdArrowBack size={22} />
                </button>
            </div>

            {/* Signup Section */}
            <div className="min-h-[72vh] bg-white flex items-center justify-center px-4">

                <div className="w-full max-w-[520px] bg-white rounded-md shadow-md
                        hover:shadow-lg px-10 py-10 transition duration-300">

                    {/* Logo */}
                    <div className="flex justify-center items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                                <span className="w-3 h-6 bg-white rounded-sm"></span>
                            </div>
                        </div>

                        <h1 className="text-5xl font-semibold text-[#172B4D]"> Taskify </h1>
                    </div>


                    <h2 className="text-center text-xl font-semibold text-[#172B4D] mb-8">Sign up to continue</h2>

                    <button onClick={googleSignUp} className="w-full h-12 active:scale-[0.98] border border-gray-300 rounded-md flex items-center justify-center gap-3
                       text-[#172B4D] font-semibold hover:bg-gray-50 transition duration-200 cursor-pointer" >
                        <FcGoogle className="text-2xl" /> Sign up with Google
                    </button>

                    <div className="flex items-center gap-3 my-7">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="text-sm text-gray-500"> OR </span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                    </div>

                    {/* Sign In */}
                    <p className="text-center text-sm text-gray-600">
                        Have an account?{" "}
                        <button onClick={() => navigate("/signin")} className="text-[#2563EB] font-semibold hover:underline cursor-pointer" >
                            Sign in
                        </button>
                    </p>

                </div>
            </div>
        </>
    )
}

export default SignUp
