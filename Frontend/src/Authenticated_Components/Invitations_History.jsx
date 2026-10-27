import { set_type_invitation } from '@/Redux_Store/workspaceSlice'
import { get_all_type_invitations } from '@/Workspace_Hooks/get_all_type_invitations'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Search, Filter, ArrowDownUp, ChevronDown } from "lucide-react";

const Invitation_History = ({ type }) => {
    let dispatch = useDispatch()
    let params = useParams()
    let workspace_id = params.id


    let { workspace, workspace_type_invitations, workspace_type_invitations_loading, type_invitation } = useSelector(state => state.workspace)
    let { theme } = useSelector(state => state.theme)


    useEffect(() => {
        dispatch(set_type_invitation(''))
    }, [dispatch])

    // hook for type invitation : 
    get_all_type_invitations(workspace_id)


    let currentWorkspace = workspace.find(ws => ws?.workspace?._id === workspace_id)
    let isOwner = currentWorkspace?.role === 'workspace_owner'
    let isMember = currentWorkspace?.role === 'workspace_member'

    // Format date :
    let formatDate = (dateStr) => {
        if (!dateStr) return '_'
        let date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    let activity_css = `px-2 py-1 flex h-auto lg:h-13 w-24 shrink-0 flex-col items-start justify-center rounded-lg border text-left text-xs font-semibold ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-slate-200" : "border-slate-200 bg-white text-slate-700"}`


    return (
        <div>

            {/* search and sorting */}
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
                                value={type_invitation}
                                onChange={(e) => dispatch(set_type_invitation(e.target.value))}
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

            <hr className={`mb-3 border-1 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />

            {/* max-h-[60vh] overflow-y-auto */}
            <div className="mt-4 min-h-0 max-h-[60vh] w-full overflow-y-auto overscroll-contain">

                {workspace_type_invitations_loading ? (
                    <div className="flex justify-center py-10" role="status" aria-label="Loading invitations">
                        <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
                    </div>

                ) : workspace_type_invitations && workspace_type_invitations.length > 0 ? (
                    workspace_type_invitations.map((i) => (
                        <div key={i?.invitedEmail || i?.latest?._id}>
                            <div
                                className={`flex flex-col gap-4 border-b px-3 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6
            ${theme === "dark" ? "border-slate-700 bg-[#1a1a1b] text-white" : "border-slate-200 bg-white text-slate-900"}`}
                            >

                                {/* LEFT: user info */}
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div
                                        aria-hidden="true"
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-sm font-semibold uppercase text-white ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                                    >
                                        {(i?.invitedUser?.name || i?.invitedEmail || "_").trim().charAt(0)}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">
                                            {i?.invitedUser?.name || i?.invitedEmail || "Null"}
                                        </p>
                                        <p
                                            title={i?.invitedEmail}
                                            className={`truncate text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                        >
                                            {i?.invitedEmail || "Null"}
                                        </p>
                                    </div>
                                </div>

                                {/* RIGHT: counts + date/status + re-send */}
                                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:justify-end lg:gap-6">

                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={activity_css}>
                                                <span className="text-[15px] font-semibold text-red-400">{i?.cancelledCount || 0}x</span>
                                                <span className="whitespace-nowrap">You cancelled</span>
                                            </span>

                                            <span className={activity_css}>
                                                <span className="text-[15px] font-semibold text-amber-400">{i?.declinedCount || 0}x</span>
                                                <span className="whitespace-nowrap">User declined</span>
                                            </span>

                                            <span className={activity_css}>
                                                <span className="text-[15px] font-semibold text-slate-400">{i?.expiredCount || 0}x</span>
                                                <span className="whitespace-nowrap">Expired</span>
                                            </span>
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-3 lg:mt-0 lg:justify-end lg:gap-5">
                                            {i?.latest?.updatedAt && (
                                                <p className={`whitespace-nowrap text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                                                    {formatDate(i?.latest?.updatedAt)}
                                                </p>
                                            )}

                                            <div
                                                className={`inline-flex min-w-24 items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-semibold capitalize
                    ${i?.latest?.status?.toLowerCase() === "cancelled" ? "border-red-500/50 bg-red-500/10 text-red-400"
                                                        : i?.latest?.status?.toLowerCase() === "declined" ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                                                            : i?.latest?.status?.toLowerCase() === "expired" ? "border-slate-500/50 bg-slate-500/10 text-slate-400"
                                                                : "border-slate-500/30 bg-slate-500/5 text-slate-400"}`}
                                            >
                                                {i?.latest?.status || "No activity"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* pendingInvitation false ho tabhi re-send */}
                                    {!i?.pendingInvitation && ['cancelled', 'expired'].includes(i?.latest?.status) && (
                                        <button
                                            type="button"
                                            className={`w-full cursor-pointer rounded-xl border px-4 py-1.5 text-sm font-semibold transition-colors duration-200 sm:w-auto
                  ${theme === "dark"
                                                    ? "border-green-600/60 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                                                    : "border-green-400 bg-green-200 text-black hover:bg-green-300"}`}
                                        >
                                            re-send
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={`py-12 text-center text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                        No {type} invitations found
                    </div>
                )}
            </div>
        </div>
    )
}

export default Invitation_History