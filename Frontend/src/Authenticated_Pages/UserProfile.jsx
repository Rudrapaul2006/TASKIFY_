import Auth_Navbar from '@/Authenticated_Components/Auth_Navbar'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiEdit2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { setUpdateUser } from '@/Redux_Store/userSlice'
import axios from 'axios'
import { PopoverContent, Popover, PopoverTrigger } from '@/Components/ui/popover'
import { IoMdArrowBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom'


const UserProfile = () => {
    let { user } = useSelector((state) => state.user)
    let { theme } = useSelector((state) => state.theme)

    let dispatch = useDispatch()
    let navigate = useNavigate()

    let [updatedName, setUpdatedName] = useState('')
    let [updatedProfileImage, setUpdatedProfileImage] = useState('')

    let [editSpinning, setEditSpinning] = useState(false)
    let [popoverOpen, setPopoverOpen] = useState(false)
    let [isUpdating, setIsUpdating] = useState(false)


    // user update handler :
    let updateUserHandler = async (e) => {
        e.preventDefault()

        if (!updatedName.trim() && !updatedProfileImage) {
            toast.error('Please update your name or profile image')
            return
        }

        setIsUpdating(true)

        try {
            let formData = new FormData()

            formData.append('name', updatedName.trim() || user?.name || '')
            if (updatedProfileImage) { formData.append('logo', updatedProfileImage) }

            let res = await axios.put(`${import.meta.env.VITE_user_endpoint}/update`, formData, { withCredentials: true })
            if (res.data.success) {
                dispatch(setUpdateUser(res.data.user))
                toast.success(res.data.message)
                setUpdatedName('')
                setUpdatedProfileImage('')
                setPopoverOpen(false)
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || 'Something went wrong!')
        } finally {
            setIsUpdating(false)
        }
    }

    // Cover image update handler: [user name and profile image update]
    let updateCoverImageHandler = async (e) => {
        let file = e.target.files?.[0]
        if (!file) return

        try {
            let formData = new FormData()
            formData.append('coverImage', file)

            let res = await axios.put(`${import.meta.env.VITE_user_endpoint}/update_cover_image`, formData, { withCredentials: true })
            if (res.data.success) {
                dispatch(setUpdateUser(res.data.user))
                toast.success('Cover image updated!')
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || 'Failed to update cover image')
        } finally {
            e.target.value = ''
        }
    }

    let isDark = theme === 'dark'

    return (
        <>
            <Auth_Navbar />

            <main className={`min-h-[89.5vh] px-4 py-10 transition-colors ${isDark ? 'bg-[#18181a]' : 'bg-gray-100'}`} >
                
                <div className="fixed left-4 top-24 z-40 w-fit lg:mx-18">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${isDark ? ' text-gray-300 bg-[#2A2A2D] hover:bg-[#343438] hover:text-white duration-150'
                            : ' bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900 duration-150'}`}
                    >
                        <IoMdArrowBack size={20} />
                        <span>Back</span>
                    </button>
                </div>

                <section className={`mt-13 lg:mt-4 mx-auto min-h-[500px] w-full max-w-4xl overflow-hidden rounded-xl border shadow-lg ${isDark ? 'border-[#3A3A3D] bg-[#1F1F21] text-white'
                    : 'border-gray-200 bg-white text-gray-800'}`} >

                    {/* cover image */}
                    <div className={`group relative h-[180px] w-full overflow-hidden sm:h-[200px] lg:h-[250px] ${isDark ? 'bg-gradient-to-r from-[#2b2459] to-[#4d2e70]' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
                        {user?.coverAvatar && (
                            <img
                                src={user?.coverAvatar}
                                alt="Cover"
                                className="h-full w-full object-cover"
                            />
                        )}

                        <label
                            htmlFor="cover-image"
                            className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                            aria-label="Update cover image"
                        >
                            <FiEdit2 size={18} />
                        </label>

                        <input
                            id="cover-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={updateCoverImageHandler}
                        />
                    </div>


                    <div className="px-8 pb-8">

                        <div className="group relative -mt-16 mb-5 h-32 w-32">
                            <div className={`h-32 w-32 overflow-hidden rounded-full border-4 ${isDark ? 'border-[#1F1F21]' : 'border-white'} bg-indigo-600`}>
                                {(user?.avatar || updatedProfileImage) ? (
                                    <img
                                        src={updatedProfileImage ? URL.createObjectURL(updatedProfileImage) : user.avatar}
                                        alt={user?.name || 'Profile'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold"> {user?.name || 'User Name'} </h1>

                        <div className={`mt-6 border-t text-left ${isDark ? 'border-[#3A3A3D]' : 'border-gray-200'}`} >
                            <div className={`flex justify-between gap-4 border-b py-4 ${isDark ? 'border-[#3A3A3D]' : 'border-gray-200'}`} >
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'} >
                                    Email
                                </span>
                                <span className="font-medium"> {user?.email || '-'} </span>
                            </div>

                        </div>

                        <div className="mt-6">
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>

                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditSpinning(true)
                                            setTimeout(() => setEditSpinning(false), 500)

                                            if (!popoverOpen) setUpdatedName(user?.name || '')
                                        }}
                                        className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${isDark
                                            ? 'border-[#3A3A3D] bg-[#1F1F21] text-yellow-300 hover:border-[#545458] hover:bg-[#2A2A2D] focus-visible:ring-offset-[#1F1F21]'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 focus-visible:ring-offset-white'}`}
                                    >
                                        <FiEdit2 className={editSpinning ? 'animate-spin' : ''} size={16} />
                                        <span>Edit Profile</span>
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className={`rounded-xl shadow-xl ${isDark ? 'border-[#3A3A3D] bg-[#1F1F21] text-white' : 'border-gray-200 bg-white text-gray-800'}`}>
                                    <p className="text-sm font-medium">Edit your profile details</p>

                                    <form className="mt-4 space-y-4" onSubmit={updateUserHandler}>
                                        <div>
                                            <label htmlFor="profile-name" className="mb-1 block text-sm">Name</label>
                                            <input
                                                id="profile-name"
                                                type="text"
                                                value={updatedName}
                                                onChange={(e) => setUpdatedName(e.target.value)}
                                                placeholder={user?.name || 'Your name'}
                                                className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'border-[#3A3A3D] bg-[#18181a] text-white placeholder:text-gray-500' : 'border-gray-300 bg-white text-gray-800 placeholder:text-gray-400'}`}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="profile-image" className="mb-1 block text-sm">Profile image</label>
                                            <input
                                                id="profile-image"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setUpdatedProfileImage(e.target.files?.[0] || '')}
                                                className={`w-full rounded-md border px-3 py-2 text-sm ${isDark ? 'border-[#545458] bg-[#18181a] text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                            {isUpdating ? 'Updating...' : 'Update profile'}
                                        </button>

                                    </form>
                                </PopoverContent>

                            </Popover>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export default UserProfile