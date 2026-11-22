import Join_Requests from "@/Authenticated_Components/Join_Requests"
import Sended_Invtations from "@/Authenticated_Components/Sended_Invtations"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog"
import { cancel_user_join_request, decline_join_request, set_add_invitation, set_pending_invitation_search, set_pending_invitation_sorting, set_resend_workspace_invitation, set_workspace_join_request, set_workspace_member_search, set_workspace_member_sorting, setWorkspaceMembers, setWorkspaceMembersCount, setWorkspaceMembersLoading } from "@/Redux_Store/workspaceSlice"
import { getSocket } from "@/SocketConnection/socket"
import get_all_join_request from "@/Workspace_Hooks/get_all_join_request"
import get_all_members from "@/Workspace_Hooks/get_all_members"
import { Input } from "@base-ui/react"
import axios from "axios"
import { Crown, LogOut, Search, UserPlus, X } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"

const WorkspaceMembers = () => {
  let socket = getSocket()
  let dispatch = useDispatch()
  let navigate = useNavigate()

  let { user } = useSelector(state => state.user)
  let { theme } = useSelector(state => state.theme)
  let { workspace_join_request, workspace, workspaceMembersCount, workspaceMembers, workspaceMembersLoading, workspace_member_search, workspace_member_sorting } = useSelector(state => state.workspace)

  let params = useParams()
  let workspace_id = params.id


  let currentWorkspace = workspace.find(ws => ws?.workspace?._id === workspace_id)
  let isOwner = currentWorkspace?.role === 'workspace_owner'
  let isMember = currentWorkspace?.role === 'workspace_member'


  // Persist the selected tab per workspace so refresh keeps the same view
  let tabStorageKey = `workspace_tab:${workspace_id}`
  let validTabs = ["members", "invitation", "joinRequest"]

  let [activeTab, setActiveTab] = useState(() => {
    let savedTab = localStorage.getItem(tabStorageKey)
    return validTabs.includes(savedTab) ? savedTab : "members"
  })

  useEffect(() => {
    let savedTab = localStorage.getItem(tabStorageKey)
    setActiveTab(validTabs.includes(savedTab) ? savedTab : "members")
  }, [tabStorageKey])

  let changeActiveTab = (tab) => {
    setActiveTab(tab)
    localStorage.setItem(tabStorageKey, tab)
  }


  // Flash the active tab on url 
  useEffect(() => {
    if (!workspace_id) return
    navigate(`/workspace/members/${workspace_id}?active_tab=${activeTab}`, { replace: true })
  }, [activeTab, navigate, workspace_id])


  // Get Members of each Workspace [hook]
  get_all_members(workspace_id, activeTab)
  get_all_join_request(workspace_id)

  // // fetch real time user's join req
  useEffect(() => {
    if (socket) {
      socket.on("user_join_requests", (data) => {
        dispatch(set_workspace_join_request([data.joinrequest, ...(workspace_join_request || [])]))
      })

      return () => {
        socket.off("user_join_requests")
      }
    }
  }, [user?._id, socket, workspace_id, workspace_join_request, dispatch])

  // filter user's cancel join request :
    useEffect(() => {
      if (socket) {
        socket.on("canceled_join_request", (data) => {
          dispatch(decline_join_request(data.joinrequest))
        })
      }
  
      return () => {
        socket.off("canceled_join_request")
      }
    }, [socket, user?._id, dispatch])


  // send invitation to user :
  let [invitedEmail, setInvitedEmail] = useState('')
  let [invitationLoading, setInvitationLoading] = useState(false)
  let [invitationDialogOpen, setInvitationDialogOpen] = useState(false)

  let send_invitation = async () => {
    try {
      if (!workspace_id) {
        dispatch(set_add_invitation([]))
        return
      }
      setInvitationLoading(true)

      let res = await axios.post(`${import.meta.env.VITE_workspace_endpoint}/send_invitation/${workspace_id}`, { email: invitedEmail }, { withCredentials: true })

      if (res.data.success) {
        toast.success(res.data.message || 'Invitation sent successfully')
        dispatch(set_add_invitation(res.data.invitation))
        dispatch(set_resend_workspace_invitation(res.data.invitation)) // invitation activity page me reh ke agar owner ne invite button se cancelled user ko invitation vejega to 
        setInvitationDialogOpen(false)                                // us user ka cancel invitation activity page se clear ho jayega [active status = pending]                 
        setInvitedEmail('')
      } else {
        dispatch(set_add_invitation([]))
      }
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || 'something error in send invitation')
    } finally {
      setInvitationLoading(false)
    }
  }


  // clear search and sorting when workspace get change 
  useEffect(() => {
    dispatch(set_workspace_member_search(''))
    dispatch(set_workspace_member_sorting(''))
  }, [workspace_id, dispatch])

  // navigate search and sorting on url
  useEffect(() => {
    navigate(`/workspace/members/${workspace_id}?active_tab=${activeTab}${workspace_member_search ? '&query=' + workspace_member_search : ''}${workspace_member_sorting ? '&sort=' + workspace_member_sorting : ''}`, { replace: true })
  }, [workspace_id, workspace_member_search, workspace_member_sorting, navigate, dispatch])

  return (
    <>
      <div className={`sticky top-0 z-[50] ${theme === "dark" ? "bg-[#1a1a1b]" : "bg-gray-50"} -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8`}>


        <div className="flex justify-between items-center mt-0 lg:mt-3 pt-3 pb-5">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg lg:text-xl font-semibold leading-tight">Members</span>
            <span className={`text-xs lg:text-[14px] ${theme === "dark" ? 'text-slate-400' : 'text-slate-500'}`}>
              {workspaceMembersCount} people is in the workspace
            </span>
          </div>

          {/* Invite member (button) (owner) */}
          {isOwner && (
            <div>
              <Dialog open={invitationDialogOpen} onOpenChange={(open) => { setInvitationDialogOpen(open); if (!open) setInvitedEmail("") }}>
                <DialogTrigger>
                  <button
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-1.5 shadow-xs transition-all duration-300 hover:shadow-sm active:scale-[0.98]
                      ${theme === "dark" ? "border-white/10 text-white hover:bg-[#2A2A2D] hover:border-white/20" : "border-slate-400 text-slate-900 hover:bg-slate-100 hover:border-slate-600"}`}
                  >
                    <UserPlus size={16} />
                    <span className="hidden md:block lg:block text-sm font-medium">Invite Member</span>
                  </button>
                </DialogTrigger>

                <DialogContent className={`sm:max-w-md ${theme === "dark" ? "border-white/10 bg-[#1E1E20] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
                  <DialogHeader>
                    <DialogTitle className={theme === "dark" ? "text-white" : "text-slate-900"}>Invite member</DialogTitle>

                    <DialogDescription className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
                      Enter an email address to send an invitation to this workspace
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-2">
                    <label htmlFor="email" className={theme === "dark" ? "text-slate-200" : "text-slate-700"}>Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={invitedEmail}
                      onChange={(e) => setInvitedEmail(e.target.value)}
                      placeholder="user_email@gmail.com"
                      className={`rounded-md border px-3 py-2 outline-none focus:ring focus:ring-blue-500 ${theme === "dark" ? "border-white/10 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-400 bg-white text-slate-900 placeholder:text-slate-500"}`}
                    />
                  </div>

                  <DialogFooter className="gap-2 sm:justify-end">
                    <DialogClose>
                      <button onClick={() => setInvitedEmail("")} type="button"
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors 
                          ${theme === "dark" ? "border-white/10 bg-transparent text-white hover:bg-[#2A2A2D]" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
                      >
                        Cancel
                      </button>
                    </DialogClose>

                    <button
                      type="button"
                      onClick={() => {
                        send_invitation()
                      }}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      {invitationLoading ?
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-middle"
                          aria-label="Sending invitation" />
                        : "Send invitation"}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Leave workspace (for members) */}
          {!isOwner && isMember && (
            <div>
              <button className={`py-1.5 px-3 flex gap-2 items-center justify-center rounded-xl border shadow-xs transition-all hover:shadow-sm active:scale-[0.98] duration-300 cursor-pointer
                ${theme === "dark" ? "border-white/10 text-white hover:bg-[#2A2A2D] hover:border-white/20" : "border-slate-400 text-slate-900 hover:bg-slate-100 hover:border-slate-600"}`}>
                <LogOut className="mt-0.5 text-red-500" size={16} />
                <span className="text-sm font-medium">Leave workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="h-10 sm:h-11 flex items-center gap-6 sm:gap-10 lg:gap-16 text-sm font-medium sm:text-[15px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          <div className="relative h-full flex items-center">
            <button
              className={`h-full flex items-center whitespace-nowrap transition-colors duration-150 ${activeTab === 'members' ? "font-semibold text-blue-500" : theme === "dark" ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-800"}`}
              onClick={() => changeActiveTab('members')}
            >
              Members
            </button>
            {activeTab === 'members' && <span className={`absolute bottom-0 left-0 h-0.5 w-full ${theme === "dark" ? "bg-blue-500" : "bg-blue-600"}`} />}
          </div>

          {isOwner && (
            <>
              <div className="relative h-full flex items-center">
                <button
                  className={`h-full flex items-center whitespace-nowrap transition-colors duration-150 ${activeTab === 'invitation' ? "font-semibold text-blue-500" : theme === "dark" ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => changeActiveTab('invitation')}
                >
                  Invitations
                </button>
                {activeTab === 'invitation' && <span className={`absolute bottom-0 left-0 h-0.5 w-full ${theme === "dark" ? "bg-blue-500" : "bg-blue-600"}`} />}
              </div>

              <div className="relative h-full flex items-center">
                <button
                  className={`h-full flex items-center whitespace-nowrap transition-colors duration-150 ${activeTab === 'joinRequest' ? "font-semibold text-blue-500" : theme === "dark" ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => changeActiveTab('joinRequest')}
                >
                  Join Requests {workspace_join_request?.length > 0 && <span className="text-yellow-500 ml-1">({workspace_join_request.length})</span>}
                </button>
                {activeTab === 'joinRequest' && <span className={`absolute bottom-0 left-0 h-0.5 w-full ${theme === "dark" ? "bg-blue-500" : "bg-blue-600"}`} />}
              </div>
            </>
          )}
        </div>

        <hr className={`w-full border-t -mt-0.5 ${theme === "dark" ? "border-white/10" : "border-slate-300"}`} />
      </div>


      {/* Members table */}
      {activeTab === 'members' &&
        <>
          {(isOwner || isMember) && (
            <div className={`sticky top-[93px] sm:top-[97px] z-[40] pt-2.5 pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 ${theme === "dark" ? "bg-[#1a1a1b]" : "bg-gray-50"}`}>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full lg:max-w-80 lg:flex-1">
                  <Search
                    size={17}
                    className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                      }`}
                  />
                  <input
                    type="text"
                    value={workspace_member_search}
                    onChange={(e) => {
                      dispatch(set_workspace_member_search(e.target.value))
                      dispatch(set_workspace_member_sorting(''))
                    }}
                    placeholder="Search name or email"
                    className={`h-10 w-full rounded-xl border pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                      ${theme === "dark" ? "border-white/10 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={workspace_member_sorting}
                    onChange={(e) => {
                      dispatch(set_workspace_member_search(''))
                      dispatch(set_workspace_member_sorting(e.target.value))
                    }}
                    name="sort" defaultValue="" className={`h-10 w-full rounded-xl border px-3 outline-none sm:w-50 
                    ${theme === "dark" ? "border-white/10 bg-[#2A2A2D] text-white focus:ring focus:ring-blue-500" : "border-slate-300 bg-white text-slate-900 focus:ring focus:ring-blue-500"}`} >
                    <option value="">Sort</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="a-to-z">A to Z</option>
                    <option value="z-to-a">Z to A</option>
                  </select>
                </div>
              </div>

              <hr className={`mt-3 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`} />
            </div>
          )}

          {/* Table */}
          <div className="mt-4">
            {workspaceMembersLoading ? (
              <div className="flex justify-center py-10" role="status" aria-label="Loading invitations">
                <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
              </div>
            ) : (
              <div className={`overflow-auto rounded-lg border ${theme === "dark" ? "border-white/10" : "border-slate-300"}`}>
                <table className="w-full min-w-[480px] text-left">

                  <thead className={`sticky top-0 z-10 ${theme === "dark" ? "bg-[#2A2A2D] text-slate-200" : "bg-slate-50 text-slate-700"}`}>
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">User name</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                      {<th scope="col" className="px-4 py-3 font-semibold">Joining Date</th>}
                      <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Profile</th>
                      {isOwner && <th scope="col" className="px-4 py-3 font-semibold">Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {workspaceMembers?.length > 0 ? workspaceMembers?.map((wsMem) => (
                      <tr key={wsMem?._id} className={`border-t ${theme === "dark" ? "border-white/10" : "border-slate-300"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-600 bg-green-500 text-sm font-semibold text-white">
                              {wsMem?.user?.name?.trim().split(/\s+/).filter(Boolean).map((part, index, parts) => (index === 0 || index === parts.length - 1) ? part[0].toUpperCase() : "").join("") || "?"}
                            </span>
                            <span className="truncate">{wsMem?.user?.name || "Null"}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">{wsMem?.user?.email || "Null"}</td>
                        <td className="px-4 py-3">
                          {(isOwner || wsMem?.role !== 'workspace_owner') && (wsMem?.createdAt ? new Date(wsMem.createdAt).toLocaleDateString() : "Null")}
                        </td>

                        <td className="px-4 py-3">
                          {wsMem?.role === 'workspace_owner' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500 px-2.5 py-1 text-sm font-medium text-amber-600">
                              <Crown size={14} />  Owner
                            </span>
                          ) : wsMem?.role}
                        </td>

                        {
                          <td className="px-4 py-3">
                            <button onClick={() => navigate(`/workspace/member_profile/${workspace_id}/${wsMem?.user?._id.toString()}`)} className={`px-3 py-1 bg-transparent  border rounded-xl cursor-pointer  ${theme === "dark" ? "border-white/10 text-slate-200 hover:bg-[#2A2A2D] " : "border-slate-300 hover:underline hover:bg-gray-100 duration-200 text-slate-700"}`}>View</button>
                          </td>
                        }

                        {isOwner && (
                          <td className="px-4 py-3">
                            {wsMem?.role !== 'workspace_owner' && (
                              <div className={`cursor-pointer inline-flex items-center gap-2 rounded-lg border px-5 py-1.5 text-sm duration-300 active:scale-[0.98] ${theme === "dark" ? "border-white/10 text-slate-200 hover:bg-[#2A2A2D] " : "border-slate-300 hover:bg-gray-200 duration-200 text-slate-700"}`}>
                                <X className="mt-0.5" color="red" size={18} />
                                <span>Remove</span>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr className={`border-t ${theme === "dark" ? "border-white/10" : "border-slate-300"}`}>
                        <td colSpan={isOwner ? 4 : 3} className="px-4 py-6 text-center text-sm">
                          No members found
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            )}
          </div>
        </>
      }

      {/* Invitation's */}
      {activeTab === 'invitation' &&
        <>
          <Sended_Invtations />
        </>
      }

      {activeTab === 'joinRequest' &&
        <>
          <Join_Requests />
        </>
      }
    </>
  )
}

export default WorkspaceMembers