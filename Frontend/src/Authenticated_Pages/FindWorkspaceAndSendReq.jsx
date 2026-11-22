import Auth_Navbar from '@/Authenticated_Components/Auth_Navbar'
import getAllWorkspace from '@/Workspace_Hooks/getAllWorkspace'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, Globe, Lock, User, Users, Calendar, ArrowLeft, Send, Loader2 } from 'lucide-react'
import { set_user_join_requests } from '@/Redux_Store/workspaceSlice'
import User_Join_Requests from '@/Authenticated_Components/User_Join_Requests'

const FindWorkspaceAndSendReq = () => {
    // Fetch user workspaces [hook]
    getAllWorkspace()

    let navigate = useNavigate()
    let dispatch = useDispatch()

    let { user } = useSelector(state => state.user)
    let { workspace: userWorkspaces } = useSelector(state => state.workspace)
    let { theme } = useSelector((state) => state.theme)
    let isDark = theme === 'dark'



    // Back button navigation logic:
    let handleBack = () => {
        let savedWsId = typeof window !== "undefined" ? window.localStorage.getItem("selectedWorkspaceId") : null

        let matchedWs = userWorkspaces?.find((ws) => {
            let wsData = ws?.workspace || ws
            let wsId = wsData?._id || ws?._id
            return wsId === savedWsId
        }) || userWorkspaces?.[0]

        let matchedWsData = matchedWs?.workspace || matchedWs
        let targetWsId = matchedWsData?._id || matchedWs?._id

        if (targetWsId) {
            navigate(`/workspace/home/${targetWsId}`)
        } else {
            navigate('/authenticatedhome')
        }
    }

    // active tabs : [search_workspace, join_requests]
    let tab_storage_key = `user_tabs:${user?._id}`
    let valid_tabs = ['search_workspace', 'join_requests']

    let [activeTab, setActiveTab] = useState(() => {
        let saved_tab = localStorage.getItem(tab_storage_key)
        return valid_tabs.includes(saved_tab) ? saved_tab : "search_workspace"
    })

    useEffect(() => {
        let saved_tab = localStorage.getItem(tab_storage_key)
        setActiveTab(valid_tabs.includes(saved_tab) ? saved_tab : "search_workspace")
    }, [tab_storage_key])

    let changeActiveTab = (tab) => {
        setActiveTab(tab)
        localStorage.setItem(tab_storage_key, tab)

        if (tab === 'search_workspace' && findcode?.trim()) {
            find_workspace_by_findcode()
        }
    }

    // // show the active tab on url :
    // useEffect(() => {
    //     navigate(`/workspace/join/${user?._id}?active_tab=${activeTab}`, { replace: true })
    // }, [activeTab, tab_storage_key, user?._id, navigate])


    // Find workspace by find_code provided by owner :
    let [findcode, setFindCode] = useState('')
    let [workspace, setWorkspace] = useState({})
    let [loading, setLoaading] = useState(false)

    let find_workspace_by_findcode = async (e) => {
        if (e) e.preventDefault()
        if (!findcode.trim() || findcode === '  ') return

        try {
            setLoaading(true)
            setWorkspace({})
            let res = await axios.post(
                `${import.meta.env.VITE_workspace_endpoint}/find_by_code`,
                { findCode: findcode.trim() },
                { withCredentials: true }
            )

            if (res.data.success) {
                setWorkspace(res.data.workspace)
            } else {
                setWorkspace({})
            }
        } catch (error) {
            console.log(error)
            setWorkspace({})
            toast.error(error?.response?.data?.message || error?.response?.data?.mes || 'Something went wrong in find workspace')
        } finally {
            setLoaading(false)
        }
    }

    // send join req to workspace :
    let [send_req_loading, set_send_join_req_loading] = useState(false)

    let send_join_req = async (workspace_id) => {
        try {
            set_send_join_req_loading(true)
            let res = await axios.post(`${import.meta.env.VITE_workspace_endpoint}/send_join_request/${workspace_id}`, {}, { withCredentials: true })

            if (res.data.success) {
                dispatch(set_user_join_requests(res.data.joinrequest))
                setWorkspace((prev) => ({ ...prev, pendingJoinRequest: true }))
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || 'something error in sending join request api')
        } finally {
            set_send_join_req_loading(false)
        }
    }

    // Date :
    let formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    let hasWorkspace = Boolean(workspace && (workspace?._id || workspace?.name))

    return (
        <div className={`flex h-screen flex-col overflow-hidden transition-colors duration-200 ${isDark ? 'bg-[#18181a] text-slate-100' : 'bg-gray-50 text-slate-900'}`}>
            <Auth_Navbar />

            <div className="mx-4 flex min-h-0 flex-1 flex-col overflow-hidden pt-5 lg:mx-22">

                {/* Back button */}
                <div className="fixed left-4 top-24 z-40 w-fit lg:mx-18">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Go back"
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors duration-200 ${isDark ? 'border-white/10 text-gray-300 bg-[#2A2A2D] hover:bg-[#343438] hover:text-white duration-150'
                            : 'border-slate-300 bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900 duration-150'}`}
                    >
                        <ArrowLeft size={16} />
                        <span>Back</span>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className={`mt-15 lg:mt-25 flex w-full items-center gap-8 border-b text-sm font-semibold sm:gap-10 ${isDark ? 'border-white/10' : 'border-slate-300'}`}>
                    <button
                        type="button"
                        className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'search_workspace'
                            ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')}`}
                        onClick={() => changeActiveTab('search_workspace')}
                    >
                        Search workspace
                    </button>

                    <button
                        type="button"
                        className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'join_requests' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')}`}
                        onClick={() => changeActiveTab('join_requests')}
                    >
                        Join requests
                    </button>
                </div>

                <div className="mt-2 lg:mt-0 min-h-0 flex-1 overflow-y-auto pb-10">

                    {/* Search Workspace */}
                    {activeTab === 'search_workspace' && (
                        <div className="mt-7 lg:mt-15">
                            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">

                                {/* Left Card: Compact Search Box */}
                                <section className={`h-full min-h-[230px] w-full flex flex-col gap-5 rounded-2xl border p-5 shadow-sm transition-all lg:col-span-6 ${isDark ? 'border-white/10 bg-[#1F1F21]' : 'border-slate-200 bg-white'}`}>
                                    <div>
                                        <div className="mb-3.5 flex items-center justify-between">
                                            <div> <h2 className="text-md font-bold sm:text-base">Search Workspace by Find Code</h2> </div>
                                        </div>

                                        <form onSubmit={find_workspace_by_findcode} className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-end">
                                            <div className="mt-0 lg:mt-4 min-w-0 flex-1">
                                                <div className="relative">
                                                    <Search size={16} className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                                    <input
                                                        type="text"
                                                        value={findcode}
                                                        onChange={(e) => {
                                                            setFindCode(e.target.value)
                                                            setWorkspace({})
                                                        }}
                                                        placeholder="ex- [WS-8K2132A]"
                                                        className={`h-10 w-full rounded-xl border pr-3.5 pl-9.5 text-sm font-semibold uppercase tracking-wider outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'border-white/10 bg-[#2A2A2D] text-white placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal' : 'border-slate-300 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal'}`}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || !findcode.trim()}
                                                className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer ${loading || !findcode.trim() ? 'bg-blue-600/50 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}
                                            >
                                                {loading ? (
                                                    <> <Loader2 size={15} className="animate-spin" />  <span>Searching...</span> </>
                                                ) : (
                                                    <> <Search size={15} /> <span>Find Workspace</span> </>
                                                )}
                                            </button>
                                        </form>
                                    </div>

                                    <hr className={`mt-0 lg:mt-8 ${isDark ? 'border-white/10' : 'border-slate-200'}`} />

                                    <div className={`pt-0 lg:pt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Find code is case sensetive , provide right find code
                                    </div>
                                </section>

                                {/* Right Card: Compact Workspace Result (6 cols) */}
                                <section className={`h-full w-full flex flex-col justify-center overflow-hidden rounded-2xl border shadow-sm transition-all lg:col-span-6 ${isDark ? 'border-white/10 bg-[#1F1F21]' : 'border-slate-200 bg-white'}`}>
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                                            <Loader2 size={28} className="animate-spin text-blue-500" />
                                            <p className={`mt-2.5 text-xs sm:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}> Searching for workspace... </p>
                                        </div>
                                    ) : hasWorkspace ? (

                                        <div className={`m-4 flex flex-col gap-5 rounded-2xl border p-5 sm:m-4 ${isDark ? 'border-white/10 bg-[#1F1F21]' : 'border-slate-200 bg-white'}`}>
                                            <div className="flex justify-between items-center gap-4">
                                                <div className='flex items-center gap-4'>
                                                    {workspace?.logo ? (
                                                        <img
                                                            src={workspace.logo}
                                                            alt={workspace?.name || 'Workspace logo'}
                                                            className="h-[70px] w-[70px] shrink-0 rounded-2xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
                                                            {workspace?.name?.charAt(0)?.toUpperCase() || <Building2 size={28} />}
                                                        </div>
                                                    )}

                                                    <h2 className="truncate text-xl font-bold sm:text-2xl">{workspace?.name || 'Workspace'}</h2>
                                                </div>

                                                <span className={`mr-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${workspace?.privacy === 'public'
                                                    ? 'border-green-500/70 text-green-500' : 'border-red-500/70 text-red-500'} `}>
                                                    {workspace?.privacy === 'public' ? <Globe size={14} /> : <Lock color='red' size={14} />}
                                                    {workspace?.privacy || 'private'}
                                                </span>
                                            </div>

                                            {/* Workspace Owner, Member Count & Created At */}
                                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${isDark ? 'border-white/10 bg-[#252528]' : 'border-slate-200 bg-slate-50'}`}>
                                                    <User size={16} className="shrink-0 text-blue-500" />
                                                    <div className="min-w-0">
                                                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Owner</p>
                                                        <p className="truncate text-xs font-semibold">{workspace?.workspaceOwner?.name}</p>
                                                    </div>
                                                </div>

                                                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${isDark ? 'border-white/10 bg-[#252528]' : 'border-slate-200 bg-slate-50'}`}>
                                                    <Users size={16} className="shrink-0 text-indigo-500" />
                                                    <div className="min-w-0">
                                                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Members</p>
                                                        <p className="truncate text-xs font-semibold">{workspace?.membersCount} Members</p>
                                                    </div>
                                                </div>

                                                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${isDark ? 'border-white/10 bg-[#252528]' : 'border-slate-200 bg-slate-50'}`}>
                                                    <Calendar size={16} className="shrink-0 text-emerald-500" />
                                                    <div className="min-w-0">
                                                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Created At</p>
                                                        <p className="truncate text-xs font-semibold">{formatDate(workspace?.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex w-full flex-row items-center gap-2 sm:gap-4">
                                                <button
                                                    type="button"
                                                    disabled={workspace?.privacy === 'private' || workspace?.pendingJoinRequest || send_req_loading}
                                                    onClick={() => send_join_req(workspace?._id)}
                                                    className={`inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 text-xs font-semibold text-white transition-colors sm:px-4 sm:text-sm 
                                                        ${(workspace?.privacy === 'private' || workspace?.pendingJoinRequest || send_req_loading) ? `cursor-not-allowed ${isDark ? 'bg-slate-700' : 'bg-slate-400'}` : `${isDark ? 'cursor-pointer bg-green-700 hover:bg-green-600' : 'cursor-pointer bg-green-600 hover:bg-green-700'}`}`}
                                                >
                                                    <Send className='mt-0.5 lg:mt-0' size={20} />
                                                    Send join request
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/workspace/details/${workspace?._id}`)}
                                                    className={`inline-flex h-12 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-xl border px-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm 
                                                    ${isDark ? 'border-white/10 text-slate-200 hover:bg-[#2A2A2D]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                                                >
                                                    View details
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-7 px-5 text-center">
                                            <div className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? 'bg-[#2A2A2D] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                <Building2 size={20} />
                                            </div>
                                            <h3 className="text-sm font-semibold"> Workspace details will appear here </h3>
                                            <p className={`mt-0.5 max-w-xs text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}> Search using a find code to preview workspace info and send a join request </p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    )}


                    {/* Join Requests */}
                    {activeTab === 'join_requests' && (
                        <div className="mt-2">
                            <User_Join_Requests />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default FindWorkspaceAndSendReq
