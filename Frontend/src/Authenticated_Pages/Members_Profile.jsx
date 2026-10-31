import Auth_Navbar from '@/Authenticated_Components/Auth_Navbar'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IoMdArrowBack } from 'react-icons/io'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

const Members_Profile = () => {
    let dispatch = useDispatch()
    let navigate = useNavigate()

    let { theme } = useSelector(state => state.theme)
    let { workspace } = useSelector(state => state.workspace)

    let param = useParams()
    let workspace_id = param.workspaceid
    let member_id = param.userid

    let current_workspace = workspace?.find(ws => ws?.workspace?._id === workspace_id)
    let isOwner = current_workspace.role === 'workspace_owner'
    let isMember = current_workspace?.role === 'workspace_member'

    let [member, setMember] = useState({})
    let [membership, setMembership] = useState(null)
    let [memberLoading, setMemberLoading] = useState(false)

    console.log(membership);


    // Members profile
    useEffect(() => {
        if (!workspace_id || !member_id) return

        let get_profile = async () => {
            try {
                setMemberLoading(true)
                let res = await axios.get(`${import.meta.env.VITE_user_endpoint}/get_profile/${workspace_id}/${member_id}`, { withCredentials: true })

                if (res.data.success) {
                    setMember(res.data.profile)
                    setMembership(res.data.membership)
                }

            } catch (error) {
                console.log(error)
                toast.error(error?.response?.data?.message || 'something error to fetch profile')
            } finally {
                setTimeout(() => { setMemberLoading(false) }, 400)
            }
        }

        get_profile()

    }, [workspace_id, member_id])

    let grid_css = `flex justify-center items-center  min-h-12 rounded-lg border px-2 py-3 ${theme === 'dark' ? 'border-[#3A3A3D] bg-[#2A2A2D]' : 'border-gray-200 bg-gray-50'}`

    return (
        <>
            <Auth_Navbar />

            {memberLoading ? (

                <div className='flex h-[85vh] items-center justify-center'>
                    <Loader2 className={`h-10 w-10 animate-spin ${theme === 'dark' ? 'text-gray-600' : 'text-slate-600'}`} />
                    {/* Loading... */}
                </div>

            ) : (
                <>
                    <main className={`min-h-[89.5vh] px-4 py-10 transition-colors ${theme === 'dark' ? 'bg-[#18181a]' : 'bg-gray-100'}`} >

                        <div className="fixed left-4 top-24 z-40 w-fit lg:mx-18">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                aria-label="Go back"
                                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${theme === 'dark' ? ' text-gray-300 bg-[#2A2A2D] hover:bg-[#343438] hover:text-white duration-150'
                                    : ' bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900 duration-150'}`}
                            >
                                <IoMdArrowBack size={20} />
                                <span>Back</span>
                            </button>
                        </div>

                        <section className={`mt-13 lg:mt-4 mx-auto min-h-[500px] w-full max-w-4xl overflow-hidden rounded-xl border shadow-lg ${theme === 'dark' ? 'border-[#3A3A3D] bg-[#1F1F21] text-white'
                            : 'border-gray-200 bg-white text-gray-800'}`} >

                            {/* cover image */}
                            <div className={`group relative h-[180px] w-full overflow-hidden sm:h-[200px] lg:h-[250px] ${theme === 'dark' ? 'bg-gradient-to-r from-[#2b2459] to-[#4d2e70]' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
                                {member?.coverAvatar && (
                                    <img
                                        src={member?.coverAvatar}
                                        alt="Cover"
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </div>


                            <div className="px-8 pb-4">

                                <div className="group relative -mt-16 mb-5 h-32 w-32">
                                    <div className={`h-32 w-32 overflow-hidden rounded-full border-4 ${theme === 'dark' ? 'border-[#1F1F21]' : 'border-white'} bg-indigo-600`}>
                                        {(member?.avatar) ? (
                                            <img
                                                src={member?.avatar || ''}
                                                alt={member?.name || 'Profile'}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                                                {member?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h1 className="text-2xl font-bold"> {member?.name || 'User Name'} </h1>

                                <div className={`mt-6 border-t text-left ${theme === 'dark' ? 'border-[#3A3A3D]' : 'border-gray-200'}`} >
                                    <div className={`flex justify-between gap-4 border-b py-4 ${theme === 'dark' ? 'border-[#3A3A3D]' : 'border-gray-200'}`} >
                                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} >
                                            Email
                                        </span>
                                        <span className="font-medium"> {member?.email || '-'} </span>
                                    </div>

                                </div>

                            </div>

                            {(isOwner || isMember) &&
                                <div className={`w-full flex justify-between px-8 pb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <span>{membership?.role === 'workspace_owner' && isMember ? 'Workspace created' : 'Join date'}</span>
                                    <span className='ml-2 lg:mb-0 text-white font-semibold'>
                                        {(membership?.role === 'workspace_owner' && isMember ? current_workspace?.workspace?.createdAt
                                            : membership?.createdAt) ? new Date(membership?.role === 'workspace_owner' && isMember
                                                ? current_workspace?.workspace?.createdAt : membership?.createdAt).toLocaleString(undefined, { hour12: true })
                                            : '—'}
                                    </span>
                                </div>
                            }


                            <hr className={`mx-8 mb-8 ${theme === 'dark' ? 'border-[#3A3A3D]' : 'border-gray-200'}`} />

                            {isOwner &&
                                <div className={`grid grid-cols-2 gap-3 px-8 pb-8 md:grid-cols-2 lg:grid-cols-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <div className={grid_css}>You cancelled invi</div>
                                    <div className={grid_css}>Expired invi</div>
                                    <div className={grid_css}>User Declined invi</div>

                                    <div className={grid_css}>You cancel join req</div>
                                    <div className={grid_css}>Expired join req</div>

                                    <div className={grid_css}>you send invitation for _ that time</div>
                                </div>
                            }

                            {isMember &&
                                <div className={`grid grid-cols-2 gap-3 px-8 pb-8 md:grid-cols-2 lg:grid-cols-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <div className={grid_css}>You canceled invi </div>
                                    <div className={grid_css}>Expired invi </div>

                                    <div className={grid_css}>You send join req _ time</div>
                                    <div className={grid_css}>You cancelled join req </div>
                                    <div className={grid_css}>Owner cancelled join req</div>
                                    <div className={grid_css}>Expired join req</div>
                                </div>
                            }

                        </section>
                    </main>


                </>
            )}
        </>
    )
}

export default Members_Profile
