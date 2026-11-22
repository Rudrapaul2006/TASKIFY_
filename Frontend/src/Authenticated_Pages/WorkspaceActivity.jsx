import get_activity from "@/Workspace_Hooks/get_activity"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { Calendar, User } from "lucide-react"
import { Activity_Action_Message } from "@/Authenticated_Components/workspace_activity_component/Activity_Action_Message"
import { Activity_Time } from "@/Authenticated_Components/workspace_activity_component/Activity_Time"
import { Activity_Date } from "@/Authenticated_Components/workspace_activity_component/Activity_Date"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

const WorkspaceActivity = ({ activeWorkspaceId }) => {
  let { id: route_id } = useParams()
  let { theme } = useSelector((state) => state.theme)
  let { workspace, workspace_activity, workspace_activity_loading, selected_workspace } = useSelector((state) => state.workspace)

  let activeId = activeWorkspaceId || route_id || selected_workspace
  get_activity(activeId)

  let current_workspace = workspace?.find(ws => (ws?.workspace?._id || ws?._id)?.toString() === activeId?.toString())
  let isOwner = current_workspace?.role === 'workspace_owner'

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
      {/* Date Range Header: Fixed at top across all devices (no peeking) */}
      <div className={`shrink-0 z-10 pb-2.5 mb-2.5 sm:mb-3 ${theme === "dark" ? "bg-[#1a1a1b]" : "bg-gray-50"}`}>
        <div className="flex justify-end">
          <div className="w-full sm:w-55">
            <label className={`block mb-1 text-xs ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
              Date Range
            </label>
            <button
              type="button"
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:border-blue-500 
                ${theme === "light" ? "bg-white border-gray-300 text-gray-900 hover:border-gray-400" : "bg-[#1c1c1e] border-white/10 text-white hover:border-white/20"}`}
            >
              <span>Last 30 Days</span>
              <Calendar size={16} className={theme === "light" ? "text-gray-500" : "text-gray-400"} />
            </button>
          </div>
        </div>

        <hr className={`mt-2.5 border-t ${theme === "light" ? "border-gray-200" : "border-white/10"}`} />
      </div>

      {/* Activities: Dedicated Scrollable Container */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 pb-6">

        {workspace_activity_loading ? (
          <div className="flex flex-col gap-2">
            {/* Skeleton Date Header 1 */}
            {/* <div className={`h-5 w-16 rounded animate-pulse mb-2 ${theme === "dark" ? "bg-[#2A2A2D]" : "bg-slate-200"}`} /> */}

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
              <div
                key={i}
                className={`flex items-center justify-between ${isOwner ? "h-28.5" : "h-25"}  sm:h-12.5 gap-4 px-4 py-2 rounded-xl border ${theme === "dark" ? "border-white/10 bg-[#1F1F21]" : "border-gray-200 bg-white shadow-xs"}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`h-8 w-8 shrink-0 rounded-full animate-pulse ${theme === "dark" ? "bg-[#2A2A2D]" : "bg-slate-200"}`} />
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-28 sm:w-60 lg:w-120 rounded animate-pulse ${theme === "dark" ? "bg-[#2A2A2D]" : "bg-slate-200"}`} />
                  </div>
                </div>
                <div className="shrink-0">
                  <div className={`h-3.5 w-12 sm:w-14 rounded animate-pulse ${theme === "dark" ? "bg-[#2A2A2D]" : "bg-slate-200"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {workspace_activity?.length > 0 ? (
              workspace_activity?.map((i, index) => {
                let actorName = i?.actor?.name || i?.actor?.email || i?.targetUser?.name || i?.targetUser?.email || (i?.type?.toLowerCase().includes("org settings") ? "System Admin" : "Owner")

                let actionText = Activity_Action_Message(i)
                let timeAgo = Activity_Time(i?.createdAt)
                let dateTitle = Activity_Date(i?.createdAt)

                let prevDateTitle = index > 0 ? Activity_Date(workspace_activity[index - 1]?.createdAt) : null
                let showHeader = dateTitle !== prevDateTitle

                let avatarUrl = i?.actor?.avatar || i?.targetUser?.avatar || i?.meta?.avatar
                let firstLetter = (actorName || i?.targetUser?.name || "U").trim().charAt(0).toUpperCase()

                return (
                  <div key={i?._id || index}>
                    {showHeader && (
                      <h2 className={`text-base sm:text-lg font-bold mb-2.5 ${index > 0 ? "mt-4" : "mt-0"} ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`} >
                        {dateTitle}
                      </h2>
                    )}

                    <div
                      className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-0 lg:gap-4 px-4 py-2 rounded-xl border transition-colors overflow-hidden
                      ${theme === "dark" ? "border-white/10 bg-[#1F1F21] text-white " : "border-gray-200 bg-white text-gray-900 shadow-xs"}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-xs font-semibold uppercase text-white shadow-xs ring-1 ring-emerald-500/30">
                          <span>{firstLetter}</span>
                          {avatarUrl && (
                            <img
                              className="absolute inset-0 h-full w-full rounded-full object-cover"
                              src={avatarUrl}
                              alt={actorName || i?.targetUser?.name || "User"}
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          )}
                        </div>

                        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
                          <span className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                            {actorName}
                          </span>
                          <span className={theme === "dark" ? "text-slate-300" : "text-slate-600"}>
                            {actionText}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-xs sm:text-sm font-normal whitespace-nowrap ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} >
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className={`flex items-center justify-center py-10 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                No Activity
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

export default WorkspaceActivity
