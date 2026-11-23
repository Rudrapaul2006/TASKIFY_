import Auth_Navbar from '@/Components/Auth_Navbar'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Globe, Clock, ShieldCheck, Users, Kanban, Calendar, Crown, Loader2 } from 'lucide-react'
import { set_user_join_requests } from '@/Redux_Store/workspaceSlice'

const Workspace_Details = () => {
    let params = useParams()
    let workspace_id = params.id
    let navigate = useNavigate()
    let dispatch = useDispatch()

    let { theme } = useSelector((state) => state.theme)
    let isDark = theme === 'dark'

    // fetch workspace data
    let [workspace_data, set_workspace_data] = useState(null)
    let [workspace_data_loading, set_workspace_data_loading] = useState(false)
    
    useEffect(() => {
        let get_workspace_data = async () => {
            try {
                set_workspace_data_loading(true)
                let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/get_workspace_data/${workspace_id}`, { withCredentials: true })

                if (res.data.success) {
                    set_workspace_data(res.data.workspace)
                }
            } catch (error) {
                console.log(error)
            } finally {
                set_workspace_data_loading(false)
            }
        }

        get_workspace_data()

    }, [workspace_id])

    let card_border = isDark ? 'border-[#2E2E31] bg-[#18181b]' : 'border-slate-200 bg-white'

    // send join request to workspace :
    let [send_req_loading, set_send_join_req_loading] = useState(false)
    let send_join_req = async (workspaceid) => {
        try {
            set_send_join_req_loading(true)
            let res = await axios.post(`${import.meta.env.VITE_workspace_endpoint}/send_join_request/${workspaceid}`, {}, { withCredentials: true })

            if (res.data.success) {
                dispatch(set_user_join_requests(res.data.joinrequest))
                set_workspace_data((prev) => ({ ...prev, hasPendingRequest: true }))
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || 'something error in sending join request api')
        } finally {
            set_send_join_req_loading(false)
        }
    }

    return (
        <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#121214] text-slate-100' : 'bg-gray-50 text-slate-900'}`}>
            <Auth_Navbar />

            {workspace_data_loading ? (
                <div className="flex h-[85vh] items-center justify-center">
                    <Loader2 className={`h-10 w-10 animate-spin ${isDark ? 'text-slate-500' : 'text-slate-600'}`} />
                </div>
            ) : (
                <main className="mt-4 mx-4 lg:mx-22 pb-12">

                    <div className="fixed left-4 top-24 z-40 w-fit lg:mx-18">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${isDark ? ' text-gray-300 bg-[#2A2A2D] hover:bg-[#343438] hover:text-white duration-150'
                                : ' bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900 duration-150'}`}
                        >
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>
                    </div>

                    <div className="flex w-full flex-col gap-4 mt-20">
                        
                        <section className={`w-full rounded-2xl border p-5 sm:p-6 shadow-sm ${card_border}`}>
                           
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#3B5BDB] text-2xl font-bold text-white shadow-xs">
                                        R
                                    </div>

                                    <div className="min-w-0">
                                        <h1 className="truncate text-xl font-bold sm:text-2xl">
                                            {workspace_data?.name || 'null'}
                                        </h1>
                                        <p className={`mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {/* <Clock size={14} className="shrink-0" />
                                            <span>Active 2 days ago</span> */}
                                        </p>
                                    </div>
                                </div>

                                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-green-500/70 bg-green-500/10 px-3 py-1 text-xs sm:text-sm font-medium text-green-500">
                                    <Globe size={14} />
                                    <span>public</span>
                                </span>
                            </div>

                            <p className={`mt-5 text-sm sm:text-base ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                {/* {workspace_data?.description || 'null'} */}
                            </p>

                            <div className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs sm:text-sm ${isDark ? 'border-[#2E2E31] bg-[#1F1F23] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                <ShieldCheck size={18} className="shrink-0 text-blue-500" />
                                <span>Owner approval is needed to join this workspace</span>
                            </div>


                            <button
                                type="button"
                                disabled={send_req_loading || workspace_data?.hasPendingRequest}
                                onClick={() => send_join_req(workspace_data?._id)}
                                className={`mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 ${workspace_data?.hasPendingRequest ? '' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {send_req_loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                                <span>{send_req_loading ? 'Sending request…' : 'Send join request'}</span>
                            </button>

                        </section>

                       
                        <section className="grid w-full gap-3.5 grid-cols-3">
                           
                            <div className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-sm ${card_border}`}>
                                <Users size={20} className="text-blue-500" />
                                <div className="mt-3">
                                    <p className="text-xl font-bold sm:text-2xl">{workspace_data?.membersCount || 'null'}</p>
                                    <p className={`mt-0.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Members
                                    </p>
                                </div>
                            </div>


                            {/* Created */}
                            <div className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-sm ${card_border}`}>
                                <Calendar size={20} className="text-blue-500" />
                                <div className="mt-3">
                                    <p className="text-xl font-bold sm:text-2xl">{workspace_data?.createdAt && new Date(workspace_data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) || 'null'}</p>
                                    <p className={`mt-0.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Created
                                    </p>
                                </div>
                            </div>

                            {/* Owner */}
                            <div className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-sm ${card_border}`}>
                                <Crown size={20} className="text-amber-500" />
                                <div className="mt-3 min-w-0">
                                    <p className="truncate text-xl font-bold sm:text-2xl">{workspace_data?.workspaceOwner?.name || 'null'}</p>
                                    <p className={`mt-0.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Owner
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Your Request History Card */}
                        <section className={`w-full rounded-2xl border p-5 sm:p-6 shadow-sm ${card_border}`}>
                            <h2 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                YOUR REQUEST HISTORY
                            </h2>

                            <div className={`mt-3 divide-y ${isDark ? 'divide-[#2E2E31]' : 'divide-slate-200'}`}>
                                <div className="flex items-center justify-between py-3.5 text-sm sm:text-base">
                                    <span className="font-semibold">You cancelled</span>
                                    <span className="font-bold text-red-400">{workspace_data?.cancelledCount || 0}x</span>
                                </div>

                                <div className="flex items-center justify-between py-3.5 text-sm sm:text-base">
                                    <span className="font-semibold">Owner declined</span>
                                    <span className="font-bold text-amber-400">{workspace_data?.declinedCount || 0}x</span>
                                </div>

                                <div className="flex items-center justify-between py-3.5 text-sm sm:text-base">
                                    <span className="font-semibold">Expired</span>
                                    <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{workspace_data?.expiredCount || 0}x</span>
                                </div>
                            </div>

                            {/* <p className={`mt-3 pt-1 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Last request: cancelled 5 days ago
                            </p> */}
                        </section>
                    </div>
                </main>
            )}
        </div>
    )
}

export default Workspace_Details
