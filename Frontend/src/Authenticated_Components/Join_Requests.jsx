import { accept_join_request, decline_join_request, setWorkspaceMembersCount } from '@/Redux_Store/workspaceSlice'
import get_all_join_request from '@/Workspace_Hooks/get_all_join_request'
import get_all_members from '@/Workspace_Hooks/get_all_members'
import axios from 'axios'
import { ArrowDownUp, Check, ChevronDown, Filter, Loader2, Search, X } from 'lucide-react'
import React from 'react'
import toast from 'react-hot-toast'
import { FcRight } from 'react-icons/fc'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const Join_Requests = () => {

  let dispatch = useDispatch()
  let param = useParams()
  let workspace_id = param.id

  // get workspace join request [hook]
  get_all_join_request(workspace_id)


  let { theme } = useSelector(state => state.theme)
  let { workspace, workspace_join_request, workspace_join_request_loading, workspaceMembersCount  } = useSelector(state => state.workspace)
  

  let currentWorkspace = workspace.find(ws => ws?.workspace?._id === workspace_id)
  let isOwner = currentWorkspace?.role === 'workspace_owner'
  let isMember = currentWorkspace?.role === 'workspace_member'


  // sended join req timeline
  let timeAgo = (dateString) => {
    let now = new Date()
    let date = new Date(dateString)

    // compare calendar days, not 24h blocks
    let startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    let days = Math.round((startOfToday - startOfDate) / (1000 * 60 * 60 * 24))

    if (days <= 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 30) return `${days} days ago`
    let months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`
    let years = Math.floor(months / 12)
    return `${years} year${years > 1 ? "s" : ""} ago`
  }
  
 
  // Accept join request :
  let accept_join_req = async (joinReq_id) => {
    try {
      let res = await axios.post(`${import.meta.env.VITE_workspace_endpoint}/accept_join_request/${joinReq_id}` , {}, {withCredentials: true})

      if (res.data.success){
        toast.success(res.data.message)
        dispatch(accept_join_request(res.data.acceptedRequest))
        dispatch(setWorkspaceMembersCount(workspaceMembersCount + 1))
      }
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || 'Something error in accept api')
    }
  }

  // Reject join request :
  let decline_join_req = async (joinReq_id) => {
    try {
      let res = await axios.post(`${import.meta.env.VITE_workspace_endpoint}/decline_join_request/${joinReq_id}` , {}, {withCredentials: true})

      if (res.data.success){
        toast.success(res.data.message)
        dispatch(decline_join_request(res.data.declineRequest))
      }
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || 'Something error in accept api')
    }
  }


  return (
    <>

      {(isOwner || isMember) && (

                <div className="mt-5 mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative w-full lg:w-80 xl:w-96">
                        <Search
                            size={17}
                            className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                                }`}
                        />
                        <input
                            type="text"
                            placeholder="Search name or email"
                            className={`h-10 w-full rounded-xl border pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${theme === "dark"
                                    ? "border-slate-600 bg-[#2A2A2D] text-white placeholder:text-slate-400"
                                    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"
                                }`}
                        />
                    </div>

                    <div className="grid w-full grid-cols-2 gap-3 lg:w-auto">
                        <div className="relative">
                            <Filter size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                            <select
                                
                                className={`h-10 w-full cursor-pointer appearance-none rounded-xl border py-2 pr-9 pl-9 text-sm outline-none transition lg:w-38 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white" : "border-slate-300 bg-white text-slate-900"
                                    }`}
                            >
                                <option value="">All types</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="expired">Expired</option>
                                <option value="declined">Declined</option>
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                        </div>

                        <div className="relative">
                            <ArrowDownUp size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                            <select className={`h-10 w-full cursor-pointer appearance-none rounded-xl border py-2 pr-9 pl-9 text-sm outline-none transition lg:w-38 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white" : "border-slate-300 bg-white text-slate-900"
                                }`}>
                                <option value="">Sort</option>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>
            )}


      {/* user's join request */}
      {workspace_join_request_loading ?

        <div className='w-full flex items-center justify-center'>
          <div className={`mt-12 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
        </div> : workspace_join_request?.length > 0 ?

          workspace_join_request?.map(i => (
            <main key={i?._id || i?.id}>
              <div
                className={`flex flex-col justify-between gap-4 border-b px-2 py-4 last:border-b-0 sm:flex-row sm:items-center sm:px-1 
              ${theme === "dark" ? "border-slate-700 bg-[#1a1a1b] text-white" : "border-slate-200 bg-white text-slate-900"}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold uppercase text-white ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                  >
                    {(i?.user?.name || "Null").trim().charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {i?.user?.name || "Null"}
                    </p>

                    <p
                      title={i?.user?.email}
                      className={`truncate text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {i?.user?.email || "Null"}
                    </p>
                  </div>
                </div>

                {isOwner &&
                  <div className='flex flex-col lg:flex-row gap-4 lg:gap-25 lg:justify-center lg:items-center'>
                    <div>
                      <span className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                        {i?.createdAt && !Number.isNaN(new Date(i?.createdAt).getTime())
                          ? `( ${timeAgo(i?.createdAt)} )`
                          : "Date unavailable"}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row lg:flex-row w-full gap-2 sm:w-auto sm:justify-self-end">

                      <button
                        onClick={() => accept_join_req(i?._id?.toString())}
                        type="button"
                        className={`w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-1.5 text-sm duration-300 active:scale-[0.98] ${theme === "dark"
                          ? "border-slate-600 text-slate-200 hover:bg-[#2A2A2D]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                      >
                        <Check className="mt-1 lg:mt-0.5" color="green" size={18} />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => decline_join_req(i?._id)}
                        className={`w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-1.5 text-sm duration-300 active:scale-[0.98] ${theme === "dark"
                          ? "border-slate-600 text-slate-200 hover:bg-[#2A2A2D]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                      >
                        <X className="mt-1 lg:mt-0.5" color="red" size={18} />
                        <span>Cancel</span>
                      </button>

                    </div>
                  </div>
                }

              </div>

              <hr className={`border-0 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />
            </main>
          )) :

          <div className='mt-12 text-sm text-slate-400 w-full flex items-center justify-center'>
            No request founded yet
          </div>
      }
    </>
  )
}

export default Join_Requests
