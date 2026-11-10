import { set_type_join_request_search, set_type_join_request_sort } from '@/Redux_Store/workspaceSlice'
import get_all_join_request from '@/Workspace_Hooks/get_all_join_request'
import get_all_type_join_request from '@/Workspace_Hooks/get_all_type_join_request'
import { ArrowDownUp, ChevronDown, Filter, Search, X } from 'lucide-react'
import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

const Join_Request_History = ({ onClear }) => {
    let params = useParams()
    let workspace_id = params.id

    // owner hook [for getting all type of join request history]
    get_all_type_join_request(workspace_id)

    let navigate = useNavigate()
    let dispatch = useDispatch()

    let { theme } = useSelector(state => state.theme)
    let { workspace, workspace_type_join_request, workspace_type_join_request_loding, type_join_request_search, type_join_request_sort } = useSelector(state => state.workspace)

    let currentWorkspace = workspace.find(ws => ws?.workspace?._id === workspace_id)
    let isOwner = currentWorkspace?.role === 'workspace_owner'
    let isMember = currentWorkspace?.role === 'workspace_member'

    let formatDate = (dateStr) => {
        if (!dateStr) return '_'
        let date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    // Flash search and sort on url :
    useEffect(() => {
        dispatch(set_type_join_request_search(''))
        dispatch(set_type_join_request_sort(''))
    }, [dispatch, navigate, workspace_id])

    useEffect(() => {
        navigate(`/workspace/members/${workspace_id}?active_tab=joinRequest&joinRequestActivity${type_join_request_search ? '&query=' + type_join_request_search : ''}${type_join_request_sort ? '&sort=' + type_join_request_sort : ''}`)
    }, [dispatch, navigate, workspace_id, type_join_request_search, type_join_request_sort])

    let chipBase = "cursor-pointer rounded-xl border px-4 py-1 text-sm font-medium transition-all duration-200 shrink-0 inline-flex items-center justify-center"
    let chipActive = "border-blue-500 text-blue-500 bg-blue-500/20"
    let activity_css = `px-2 py-1 flex h-auto lg:h-13 w-24 shrink-0 flex-col items-start justify-center rounded-lg border text-left text-xs font-semibold ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`

    return (
        <div>
            <div className={`sticky top-[107.5px] sm:top-[115px] z-[40] pt-2.5 pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 ${theme === "dark" ? "bg-[#1a1a1b]" : "bg-gray-50"}`}>

                {/* Activity & Clear buttons */}
                {isOwner && (
                    <div className="mb-2.5 flex items-center gap-2 sm:gap-3">
                        <button className={`${chipBase} ${chipActive}`}>
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
                )}

                <hr className={`mb-3 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />

                {/* search and sorting */}
                {(isOwner || isMember) && (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative w-full lg:max-w-80 lg:flex-1">
                            <Search
                                size={17}
                                className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                            />
                            <input
                                type="text"
                                value={type_join_request_search}
                                onChange={(e) => {
                                    dispatch(set_type_join_request_search(e.target.value))
                                    dispatch(set_type_join_request_sort(''))
                                }}
                                placeholder="Search name or email"
                                className={`h-10 w-full rounded-xl border pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                                    ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
                            />
                        </div>


                        <div className="relative">
                            <Filter size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                            <select
                                value={type_join_request_sort}
                                onChange={(e) => {
                                    dispatch(set_type_join_request_search(''))
                                    dispatch(set_type_join_request_sort(e.target.value))
                                }}
                                className={`h-10 w-full cursor-pointer appearance-none rounded-xl border py-2 pr-9 pl-9 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 lg:w-40 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white" : "border-slate-300 bg-white text-slate-900"}`}
                            >
                                <option value="">All types</option>
                                <option value="expired">Expired</option>
                                <option value="declined">Declined</option>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />

                        </div>
                    </div>
                )}

                <hr className={`mt-3 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />
            </div>

            {/* List of join request history items */}
            {workspace_type_join_request_loding ? (
                <div className="flex justify-center py-10" role="status" aria-label="Loading join requests">
                    <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
                </div>
            ) : workspace_type_join_request && workspace_type_join_request.length > 0 ? (
                workspace_type_join_request.map((i) => {
                    return (
                        <div key={i?.user?._id || i?.latest?._id}>
                            <div
                                className={`flex flex-col gap-4 border-b px-3 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6
                                 ${theme === "dark" ? "border-slate-700 bg-[#1a1a1b] text-white" : "border-slate-200 bg-white text-slate-900"}`}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div
                                        aria-hidden="true"
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-sm font-semibold uppercase text-white ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                                    >
                                        {(i?.user?.name || i?.user?.email || "_").trim().charAt(0)}
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

                                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:justify-end lg:gap-6">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={activity_css}>
                                                <span className="text-[15px] font-semibold text-red-400">{i?.declinedCount || 0}x</span>
                                                <span className="whitespace-nowrap">You declined</span>
                                            </span>

                                            <span className={activity_css}>
                                                <span className="text-[15px] font-semibold text-slate-400">{i?.expiredCount || 0}x</span>
                                                <span className="whitespace-nowrap">Expired</span>
                                            </span>
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-3 lg:mt-0 lg:justify-end lg:gap-5">
                                            <div className='flex flex-col lg:flex-row lg:justify-center lg:items-center gap-4'>
                                                {i?.latest?.updatedAt && (
                                                    <p className={`mx-0.5 lg:mx-0 whitespace-nowrap text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                                                        {formatDate(i?.latest?.updatedAt)}
                                                    </p>
                                                )}

                                                <div className="flex flex-row justify-between gap-2">
                                                    <div
                                                        className={`inline-flex min-w-24 cursor-no-drop items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-semibold capitalize
                                                            ${i?.latest?.status?.toLowerCase() === "declined" ? "border-red-500/50 bg-red-500/10 text-red-400"
                                                                : i?.latest?.status?.toLowerCase() === "expired" ? "border-slate-500/50 bg-slate-500/10 text-slate-400"
                                                                    : "border-slate-500/30 bg-slate-500/5 text-slate-400"}`}
                                                    >
                                                        {i?.latest?.status || "No activity"}
                                                    </div>
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

export default Join_Request_History
