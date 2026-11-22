import { resend_user_join_request } from '@/Redux_Store/workspaceSlice'
import join_request_history from '@/User_Hooks/join_request_history'
import axios from 'axios'
import { Building2, ChevronDown, Filter, Search, X } from 'lucide-react'
import React from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const User_Join_Request_History = ({ onClear }) => {
  join_request_history()

  let dispatch = useDispatch()
  let { theme } = useSelector((state) => state.theme)
  let { user_type_join_request, user_type_join_request_loading } = useSelector((state) => state.workspace)

  
  let formatDate = (dateStr) => {
    if (!dateStr) return '_'
    let date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }


  // resend user join request to workspace owner:
  let resend_join_request = async (joinRequestId) => {
    try {
        let res = await axios.post(`${import.meta.env.VITE_workspace_endpoint}/resend_join_request/${joinRequestId}`, {}, { withCredentials: true })
        if (res.data.success){
          dispatch(resend_user_join_request(res.data.joinrequest))
          
          toast.success(res.data.message || "Join request resent successfully")
        }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to resend join request")
    }
  }


  let chipBase = "cursor-pointer rounded-xl border px-4 py-1 text-sm font-medium transition-all duration-200 shrink-0 inline-flex items-center justify-center"
  let chipActive = "border-blue-500 text-blue-500 bg-blue-500/20"
  let activity_css = `px-2 py-1 flex h-auto lg:h-13 w-24 shrink-0 flex-col items-start justify-center rounded-lg border text-left text-xs font-semibold ${theme === "dark" ? "border-white/10 bg-transparent text-slate-200" : "border-slate-200 bg-white text-slate-700"}`


  return (
    <div className="w-full">

      <div className={`sticky top-0 z-30 pb-2 ${theme === "dark" ? "bg-[#18181a]" : "bg-gray-50"}`}>

        {/* Activity & Clear buttons */}
        <div className="mb-3 mt-3 flex items-center gap-2 sm:gap-3">
          <button type="button" className={`${chipBase} ${chipActive}`}>
            Activity
          </button>

          <button
            type="button"
            onClick={onClear}
            className={`${chipBase} gap-2 border-red-500 text-red-500 hover:border-red-400 hover:bg-red-500/10`}
          >
            <X className="mt-0.5" size={16} aria-hidden="true" />
            Clear
          </button>
        </div>

        <hr className={`mb-3 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />

        {/* Search and Sorting */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
          <div className="relative w-full lg:max-w-80 lg:flex-1">
            <Search
              size={17}
              className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
            />
            <input
              type="text"
              placeholder="Search workspace name"
              className={`h-10 w-full rounded-xl border pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <Filter size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <select
              className={`h-10 w-full cursor-pointer appearance-none rounded-xl border py-2 pr-9 pl-9 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-44 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white" : "border-slate-300 bg-white text-slate-900"}`}
            >
              <option value="">All types</option>
              <option value="cancelled">Cancelled</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <hr className={`mt-3 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />
      </div>


      {/* user join request history items */}
      {user_type_join_request_loading ? (
        <div className="flex justify-center py-12" role="status" aria-label="Loading join request history">
          <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
        </div>
      ) : user_type_join_request && user_type_join_request.length > 0 ? (
        user_type_join_request?.map((i) => {
          let wsName = i?.workspace?.name || i?.workspaceName || "Workspace"
          let wsLogo = i?.workspace?.logo

          return (
            <div key={i?.workspaceId || i?.workspace?._id || i?.latest?._id}>
              <div
                className={`mt-2 flex flex-col gap-4 rounded-md border px-3 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 ${theme === "dark" ? "border-white/10 bg-transparent text-white" : "border-slate-200 bg-white text-slate-900"}`}
              >
                {/* Left: Workspace Avatar & Name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {wsLogo ? (
                    <img
                      src={wsLogo}
                      alt={wsName}
                      className={`h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold uppercase text-white ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                    >
                      {wsName.trim().charAt(0) || <Building2 size={18} />}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {wsName}
                    </p>
                    <p
                      title={i?.workspace?.description}
                      className={`truncate text-xs sm:text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {i?.workspace?.description || "Workspace join request"}
                    </p>
                  </div>
                </div>

                {/* Right: Counts, Date, Status & Re-send */}
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:justify-end lg:gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={activity_css}>
                        <span className="text-[15px] font-semibold text-red-400">{i?.cancelledCount || 0}x</span>
                        <span className="whitespace-nowrap">You cancelled</span>
                      </span>

                      <span className={activity_css}>
                        <span className="text-[15px] font-semibold text-amber-400">{i?.declinedCount || 0}x</span>
                        <span className="whitespace-nowrap">Owner declined</span>
                      </span>

                      <span className={activity_css}>
                        <span className="text-[15px] font-semibold text-slate-400">{i?.expiredCount || 0}x</span>
                        <span className="whitespace-nowrap">Expired</span>
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 lg:mt-0 lg:justify-end lg:gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
                        {i?.latest?.updatedAt && (
                          <p className={`mx-0.5 whitespace-nowrap text-xs lg:mx-0 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                            {formatDate(i?.latest?.updatedAt)}
                          </p>
                        )}

                        <div className="flex flex-row justify-between gap-2">
                          <div
                            className={`inline-flex min-w-24 cursor-no-drop items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-semibold capitalize ${i?.latest?.status?.toLowerCase() === "cancelled"
                                ? "border-red-500/50 bg-red-500/10 text-red-400" : i?.latest?.status?.toLowerCase() === "declined"
                                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : i?.latest?.status?.toLowerCase() === "expired"
                                        ? "border-slate-500/50 bg-slate-500/10 text-slate-400" : "border-slate-500/30 bg-slate-500/5 text-slate-400"
                              }`}
                          >
                            {i?.latest?.status || "No activity"}
                          </div>

                          {i?.latest?.status?.toLowerCase() !== "declined" && (
                            <button
                              type="button"
                              onClick={() => resend_join_request(i?.latest?._id)}
                              className="cursor-pointer rounded-xl border border-green-500 px-3 py-1.5 text-sm font-semibold text-green-500 transition-colors hover:bg-green-500/10"
                            >
                              Re-send
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      ) : (
        <div className={`py-12 text-center text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
          No join request activity found
        </div>
      )}
    </div>
  )
}

export default User_Join_Request_History
