import { cancel_user_join_request, set_search_user_join_request, set_sort_user_join_request } from '@/Redux_Store/workspaceSlice'
import join_requests from '@/User_Hooks/join_requests'
import axios from 'axios'
import { Building2, ChevronDown, Filter, Globe, Lock, Search, User, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import User_Join_Request_History from './My_Join_Request_History'
import { getSocket } from '@/SocketConnection/socket'

const User_Join_Requests = () => {
  let socket = getSocket()

  let { user } = useSelector(state => state.user)

  // activity page :
  let [activityPage, setActivityPage] = useState("")

  // fetch user join requests : [user side hook]
  join_requests(activityPage)



  let dispatch = useDispatch()
  let navigate = useNavigate()

  let { theme } = useSelector((state) => state.theme)
  let { user_join_requests, user_join_request_loading, search_user_join_request, sort_user_join_request } = useSelector((state) => state.workspace)


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

  // Filtered owner's declined join requests : [by socket io]
  useEffect(() => {
    if (socket) {
      socket.on("declined_user_join_request", (data) => {
        dispatch(cancel_user_join_request(data.joinrequest))
      })
    }

    return () => {
      socket.off("declined_user_join_request")
    }
  }, [socket, user?._id, dispatch])

  // Cancel join request :
  let cancel_join_request = async (workspaceId, requestId) => {
    try {
      let res = await axios.patch(`${import.meta.env.VITE_workspace_endpoint}/${workspaceId}/cancel_join_request/${requestId}`, {}, { withCredentials: true })

      if (res?.data?.success) {
        dispatch(cancel_user_join_request(res?.data?.cancelledRequest))
        toast.success(res?.data?.message || "Join request canceled successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || "something went wrong while canceling the join request")
    }
  }

  // reset search and sort when user navigates to this page
  useEffect(() => {
    dispatch(set_search_user_join_request(''))
    dispatch(set_sort_user_join_request(''))
  }, [dispatch, navigate])


  // // flash search and sort on url
  // useEffect(() => {
  //   navigate(`/workspace/join/${user_id}?active_tab=join_requests${search_user_join_request ? `&search=${search_user_join_request}` : ''}${sort_user_join_request ? `&sort=${sort_user_join_request}` : ''}`)
  // }, [search_user_join_request, sort_user_join_request, dispatch, user_id])

  let chipBase = "cursor-pointer rounded-xl border px-4 py-1 text-sm font-medium transition-all duration-200 shrink-0 inline-flex items-center justify-center"
  let chipInactive = theme === "dark" ? "border-slate-500 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400" : "border-slate-400 text-slate-600 hover:bg-slate-100 hover:border-slate-600"

  return (
    <>
      <div className="w-full">

        {activityPage === "" && (
          <div className={`sticky top-0 z-30  pb-2 ${theme === "dark" ? "bg-[#18181a]" : "bg-gray-50"}`}>

            {/* Activity button */}
            <div className="mb-3 mt-3 flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className={`${chipBase} ${chipInactive}`}
                onClick={() => setActivityPage("activity")}
              >
                Activity
              </button>
            </div>

            <hr className={`mb-3 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />

            {/* Search Input & Filter Select */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
              <div className="relative w-full lg:max-w-80 lg:flex-1">
                <Search
                  size={17}
                  className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                />
                <input
                  type="text"
                  value={search_user_join_request}
                  onChange={(e) => {
                    dispatch(set_search_user_join_request(e.target.value))
                    dispatch(set_sort_user_join_request('')) // Reset sorting when search changes
                  }}
                  placeholder="Search workspace name"
                  className={`h-10 w-full rounded-xl border pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <Filter size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                <select
                  value={sort_user_join_request}
                  onChange={(e) => {
                    dispatch(set_search_user_join_request('')) // Reset search when sorting changes
                    dispatch(set_sort_user_join_request(e.target.value))
                  }}
                  className={`h-10 w-full cursor-pointer appearance-none rounded-xl border py-2 pr-9 pl-9 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-44 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white" : "border-slate-300 bg-white text-slate-900"}`}
                >
                  <option value="">Sort</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <hr className={`mt-3 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />
          </div>
        )}



        {/* Pending Sent Join Requests List */}
        {activityPage === '' && (
          user_join_request_loading ? (
            <div className="flex w-full items-center justify-center py-12" role="status" aria-label="Loading join requests">
              <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
            </div>
          ) : user_join_requests?.length > 0 ? (user_join_requests?.map((i) => (

            <main key={i?._id || i?.id}>
              <div
                className={`mt-2 flex flex-col justify-between gap-4 rounded-md border px-3 py-4 sm:flex-row sm:items-center ${theme === "dark" ? "border-white/10 bg-transparent text-white" : "border-slate-200 bg-white text-slate-900"}`}
              >
                {/* Workspace Info */}
                <div className="flex min-w-0 items-center gap-3">
                  {i?.workspace?.logo ? (
                    <img
                      src={i.workspace.logo}
                      alt={i?.workspace?.name || "Workspace"}
                      className={`h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold uppercase text-white ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                    >
                      {(i?.workspace?.name || "").trim().charAt(0) || <Building2 size={18} />}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {i?.workspace?.name || "Workspace"}
                      </p>

                    </div>

                    <p className={`truncate text-xs sm:text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`} >
                      {"Workspace join request"}
                    </p>
                  </div>
                </div>

                {/* Right Actions: Date, Status & Cancel */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:gap-8">
                  <div>
                    <span className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {i?.createdAt && !Number.isNaN(new Date(i?.createdAt).getTime())
                        ? `( ${timeAgo(i?.createdAt)} )`
                        : "Date unavailable"}
                    </span>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <div
                      className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border px-4 py-1.5 cursor-not-allowed text-sm font-medium capitalize ${i?.status === "pending" ? "border-yellow-500 text-yellow-400" : "border-slate-500 text-slate-400"}`}
                    >
                      {i?.status || "Pending"}
                    </div>

                    <button
                      onClick={() => cancel_join_request(i?.workspace?._id, i?._id)}
                      type="button"
                      className={`w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-1.5 text-sm duration-200 active:scale-[0.98] ${theme === "dark" ? "border-slate-600 text-slate-200 hover:bg-[#2A2A2D]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                    >
                      <X className="mt-0.5" color="red" size={18} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            </main>
          ))
          ) : (
            <div className={`mt-15 flex w-full items-center justify-center text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              No join requests sent yet
            </div>
          )
        )}
      </div>


      {
        activityPage === "activity" && <User_Join_Request_History onClear={() => setActivityPage("")} />
      }
    </>
  )
}

export default User_Join_Requests
