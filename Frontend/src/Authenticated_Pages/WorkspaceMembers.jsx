import Join_Requests from "@/Authenticated_Components/Join_Requests"
import Sended_Invtations from "@/Authenticated_Components/Sended_Invtations"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog"
import { set_add_invitation, set_pending_invitation_search, set_pending_invitation_sorting, set_workspace_member_search, set_workspace_member_sorting, setWorkspaceMembers, setWorkspaceMembersCount, setWorkspaceMembersLoading } from "@/Redux_Store/workspaceSlice"
import get_all_members from "@/Workspace_Hooks/get_all_members"
import { Input } from "@base-ui/react"
import axios from "axios"
import { Crown, LogOut, UserPlus, X } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"

const WorkspaceMembers = () => {
  let dispatch = useDispatch()
  let navigate = useNavigate()

  let { theme } = useSelector(state => state.theme)
  let { workspace, workspaceMembersCount, workspaceMembers, workspaceMembersLoading, workspace_member_search, workspace_member_sorting } = useSelector(state => state.workspace)


  let params = useParams()
  let workspace_id = params.id


  let currentWorkspace = workspace.find(ws => ws?.workspace?._id === workspace_id)
  let isOwner = currentWorkspace?.role === 'workspace_owner'
  let isMember = currentWorkspace?.role === 'workspace_member'


  // Persist the selected tab per workspace so refresh keeps the same view 
  let tabStorageKey = `workspaceMembersTab:${workspace_id}`
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

        setInvitationDialogOpen(false)
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

  let NAVBAR_HEIGHT = 69;

  return (
    <>
      <div className="flex justify-between mb-10">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">Members</span>
          <span className={`text-md font-stretch-semi-condensed ${theme === "dark" ? 'text-slate-400' : ''}`}>{workspaceMembersCount} people is in the workspace</span>
        </div>

        {/* Invite member (button) (owner) */}
        {isOwner && <div className="h-10">
          <Dialog open={invitationDialogOpen} onOpenChange={(open) => { setInvitationDialogOpen(open); if (!open) setInvitedEmail("") }}>
            <DialogTrigger>
              <button
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-2 py-2 shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98]
                  ${theme === "dark" ? "border-slate-600 text-white hover:bg-[#2A2A2D] hover:border-slate-400" : "border-slate-500 text-slate-900 hover:bg-slate-100 hover:border-slate-700"}`}
              >
                <UserPlus size={18} />
                <span className="hidden md:block">Invite Member</span>
              </button>
            </DialogTrigger>

            <DialogContent className={`sm:max-w-md ${theme === "dark" ? "border-slate-700 bg-[#1E1E20] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
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
                  className={`rounded-md border px-3 py-2 outline-none focus:ring focus:ring-blue-500 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-400 bg-white text-slate-900 placeholder:text-slate-500"}`}
                />
              </div>

              <DialogFooter className="gap-2 sm:justify-end">
                <DialogClose>
                  <button onClick={() => setInvitedEmail("")} type="button"
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors 
                      ${theme === "dark" ? "border-slate-600 bg-transparent text-white hover:bg-[#2A2A2D]" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
                  >
                    Cancel
                  </button>
                </DialogClose>

                <button
                  type="button"
                  onClick={() => send_invitation()}
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
        </div>}

        {/* Leave workspace (for members) */}
        {!isOwner && isMember && <div className="h-10">
          <button className={`py-2 px-2 flex gap-2 items-center justify-center rounded-2xl border shadow-sm transition-all hover:shadow-md active:scale-[0.98] duration-300 cursor-pointer
            ${theme === "dark" ? "border-slate-600 text-white hover:bg-[#2A2A2D] hover:border-slate-400" : "border-slate-500 text-slate-900 hover:bg-slate-100 hover:border-slate-700"}`}>
            <LogOut className="mt-0.5" color="red" size={18} />
            <span className="hidden md:block">Leave workspace</span>
          </button>
        </div>}
      </div>


      {/* Tabs */}
      <div style={{ top: NAVBAR_HEIGHT }} className="sticky z-20 bg-transparent">
        <div className="flex min-h-10 flex-wrap items-stretch gap-x-5 gap-y-2 text-sm font-medium sm:gap-x-10 sm:gap-y-3 sm:text-[15px] lg:gap-x-20">

          <div className="relative flex min-h-10 flex-col items-start">
            <button
              className={`h-10 whitespace-nowrap ${activeTab === 'members' ? "text-blue-500" : theme === "dark" ? "text-white" : "text-black"}`}
              onClick={() => changeActiveTab('members')}
            >
              Members
            </button>
            {activeTab === 'members' && <span className={`absolute -bottom-0.5 left-0 h-0.5 w-full ${theme === "dark" ? "bg-blue-500" : "bg-blue-600"}`} />}
          </div>

          {isOwner && (
            <>
              <div className="relative flex min-h-10 flex-col items-start">
                <button
                  className={`h-10 whitespace-nowrap ${activeTab === 'invitation' ? "text-blue-500" : theme === "dark" ? "text-white" : "text-black"}`}
                  onClick={() => changeActiveTab('invitation')}
                >
                  Invitations
                </button>
                {activeTab === 'invitation' && <span className={`absolute -bottom-0.5 left-0 h-0.5 w-full ${theme === "dark" ? "bg-blue-500" : "bg-blue-600"}`} />}
              </div>

              <div className="relative flex min-h-10 flex-col items-start">
                <button
                  className={`h-10 whitespace-nowrap ${activeTab === 'joinRequest' ? "text-blue-500" : theme === "dark" ? "text-white" : "text-black"}`}
                  onClick={() => changeActiveTab('joinRequest')}
                >
                  Join Requests
                </button>
                {activeTab === 'joinRequest' && <span className={`absolute -bottom-0.5 left-0 h-0.5 w-full ${theme === "dark" ? "bg-blue-500" : "bg-blue-600"}`} />}
              </div>
            </>
          )}
        </div>

        <hr className={`border-t-3 lg:border-t-2 ${theme === "dark" ? "border-slate-700" : "border-slate-400"}`} />
      </div>


      {/* Members table */}
      {activeTab === 'members' &&
        <>
          {(isOwner || isMember) && <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={workspace_member_search}
              onChange={(e) => {
                dispatch(set_workspace_member_search(e.target.value))
                dispatch(set_workspace_member_sorting(''))
              }}
              className={`h-10 w-full rounded-xl border px-3 outline-none focus:ring focus:ring-blue-500 sm:w-80 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
              type="text"
              placeholder="Search members"
            />

            <div className="w-full sm:w-auto">
              <select
                value={workspace_member_sorting}
                onChange={(e) => {
                  dispatch(set_workspace_member_search(''))
                  dispatch(set_workspace_member_sorting(e.target.value))
                }}
                name="sort" defaultValue="" className={`h-10 w-full rounded-xl border px-3 outline-none sm:w-50 
                ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white focus:ring focus:ring-blue-500" : "border-slate-300 bg-white text-slate-900 focus:ring focus:ring-blue-500"}`} >
                <option value="">Sort</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="a-to-z">A to Z</option>
                <option value="z-to-a">Z to A</option>
              </select>
            </div>
          </div>}

          <hr className={`mt-6 border-1 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />

          {/* Table */}
          <div className="mt-6">
            {workspaceMembersLoading ? (
              <div className="flex justify-center py-10" role="status" aria-label="Loading invitations">
                <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
              </div>
            ) : (
              <div className={`overflow-x-auto rounded-lg border ${theme === "dark" ? "border-slate-700" : "border-slate-300"}`}>
                <table className="w-full min-w-[480px] text-left">

                  <thead className={`sticky top-0 z-10 ${theme === "dark" ? "bg-[#2A2A2D] text-slate-200" : "bg-slate-50 text-slate-700"}`}>
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">User name</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                      {<th scope="col" className="px-4 py-3 font-semibold">Joining Date</th>}
                      <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                      {isOwner && <th scope="col" className="px-4 py-3 font-semibold">Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {workspaceMembers?.length > 0 ? workspaceMembers?.map((wsMem) => (
                      <tr key={wsMem?._id} className={`border-t ${theme === "dark" ? "border-slate-700" : "border-slate-300"}`}>
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

                        {isOwner && (
                          <td className="px-4 py-3">
                            {wsMem?.role !== 'workspace_owner' && (
                              <div className={`cursor-pointer inline-flex items-center gap-2 rounded-lg border px-5 py-1.5 text-sm duration-300 active:scale-[0.98] ${theme === "dark" ? "border-slate-600 text-slate-200 hover:bg-[#2A2A2D] " : "border-slate-300 text-slate-700"}`}>
                                <X className="mt-0.5" color="red" size={18} />
                                <span>Remove</span>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr className={`border-t ${theme === "dark" ? "border-slate-700" : "border-slate-300"}`}>
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
