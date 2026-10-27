import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { get_invitation } from '@/Workspace_Hooks/get_all_invitations'
import toast from 'react-hot-toast'
import {
  decline_invitation, set_pending_invitation_search, set_pending_invitation_sorting,
  set_workspace_invitations_loading
} from '@/Redux_Store/workspaceSlice'
import Invitation_History from './Invitations_History'

const Sended_Invtations = () => {
  let dispatch = useDispatch()
  let navigate = useNavigate()
  let params = useParams()
  let workspace_id = params.id

  // Get Workspace Invitations [hook]
  get_invitation(workspace_id)

  let tabStorageKey = `workspaceMembersTab:${workspace_id}`
  let active_tab = localStorage.getItem(tabStorageKey) || 'invitation'

  let { workspace, workspace_invitations, workspace_invitations_loading, pending_invitation_search, pending_invitation_sorting } = useSelector(state => state.workspace)
  let { theme } = useSelector(state => state.theme)

  let currentWorkspace = workspace.find(ws => ws?.workspace?._id === workspace_id)
  let isOwner = currentWorkspace?.role === 'workspace_owner'
  let isMember = currentWorkspace?.role === 'workspace_member'


  // History flash on url :
  let [activeInvitationActivity, setInvitationActivity] = useState('')
  useEffect(() => {
    if (!activeInvitationActivity) return
    navigate(`/workspace/members/${workspace_id}?active_tab=invitation&${activeInvitationActivity}`)
  }, [activeInvitationActivity, workspace_id, navigate])



  // cancel invitation :
  let cancel_invitation = async (invitation_id) => {
    try {
      let res = await axios.patch(`${import.meta.env.VITE_workspace_endpoint}/${workspace_id}/cancel_invitation/${invitation_id}`, {}, { withCredentials: true })

      if (res.data.success) {
        dispatch(decline_invitation({ _id: invitation_id }))
        toast.success(res.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || 'something error in cancel invitation api')
    }
  }


  //  navigate search and sorting on url
  useEffect(() => {
    dispatch(set_pending_invitation_search(''))
    dispatch(set_pending_invitation_sorting(''))
  }, [workspace_id, dispatch])


  // navigate sorting and searching on url :
  useEffect(() => {
    navigate(`/workspace/members/${workspace_id}?active_tab=invitation${pending_invitation_search ? '&query=' + pending_invitation_search : ''}${pending_invitation_sorting ? '&sort=' + pending_invitation_sorting : ''}`)
  }, [pending_invitation_search, dispatch, pending_invitation_sorting, navigate, workspace_id])


  let chipBase = "w-full cursor-pointer rounded-xl border px-4 py-1.5 text-sm font-medium transition-all duration-200 sm:w-auto"
  let chipInactive = theme === "dark" ? "border-slate-500 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400" : "border-slate-400 text-slate-600 hover:bg-slate-100 hover:border-slate-600"
  let chipActive = "border-blue-500 text-blue-500 bg-blue-500/20"


  return (
    <div className="mt-5 w-full">

      {/* invitation activity button */}
      {isOwner && (
        <div className="mb-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:gap-4">

          <button
            onClick={() => setInvitationActivity('invitationActivity')}
            className={`${chipBase} ${activeInvitationActivity === 'invitationActivity' ? chipActive : chipInactive}`}
          >
            Activity
          </button>

          {activeInvitationActivity && <button
            onClick={() => {
              setInvitationActivity('')
              dispatch(set_workspace_invitations_loading(true))
              setTimeout(() => dispatch(set_workspace_invitations_loading(false)), 300)
              dispatch(set_pending_invitation_search(''))
              dispatch(set_pending_invitation_sorting(''))
              navigate(`/workspace/members/${workspace_id}?active_tab=invitation`)
            }}
            className={`${chipBase} inline-flex items-center justify-center gap-2 border-red-500 text-red-500 hover:border-red-400 hover:bg-red-500/10`}
          >
            <X className="mt-0.5" size={16} aria-hidden="true" />
            Clear
          </button>
          }
        </div>
      )}


      {!activeInvitationActivity && <hr className={`mb-3 border-1 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />}


      {/* search and sorting */}
      {(isOwner || isMember) && !activeInvitationActivity && (
        <div className="mt-5 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={pending_invitation_search}
            onChange={(e) => {
              dispatch(set_pending_invitation_search(e.target.value))
              dispatch(set_pending_invitation_sorting(''))
            }}
            className={`h-10 w-full min-w-0 rounded-xl border px-3 outline-none focus:ring focus:ring-blue-500 sm:max-w-80 sm:flex-1 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
            type="text"
            placeholder="Search invitations..."
          />

          <div className="w-full sm:w-auto">
            <select
              value={pending_invitation_sorting}
              onChange={(e) => {
                dispatch(set_pending_invitation_sorting(e.target.value)),
                  dispatch(set_pending_invitation_search(''))
              }}
              className={`h-10 w-full rounded-xl border px-3 outline-none sm:w-50 ${theme === "dark" ? "border-slate-600 bg-[#2A2A2D] text-white focus:ring focus:ring-blue-500" : "border-slate-300 bg-white text-slate-900 focus:ring focus:ring-blue-500"}`}
            >
              <option defaultChecked value="">Sort</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      )}


      <hr className={`border-1 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />


      {/* history of invitation page */}
      {activeInvitationActivity && <Invitation_History />}


      {/* Default invitations list [pending invitations] */}
      {!activeInvitationActivity && (
        workspace_invitations_loading ? (
          <div className="flex justify-center py-14" role="status" aria-label="Loading invitations">
            <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
          </div>
        ) : workspace_invitations.length > 0 ? workspace_invitations?.map((i) => (
          <div key={i?._id || i?.id}>
            <div
              className={`flex flex-col justify-between gap-4 border-b px-2 py-4 last:border-b-0 sm:flex-row sm:items-center sm:px-1 
                ${theme === "dark" ? "border-slate-700 bg-[#1a1a1b] text-white" : "border-slate-200 bg-white text-slate-900"}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold uppercase text-white ring-2 ${theme === "dark" ? "ring-slate-700" : "ring-slate-100"}`}
                >
                  {(i?.invitedUser?.name || i?.invitedEmail || "Null").trim().charAt(0)}
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

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:justify-self-end md:flex-row md:gap-3 lg:items-center lg:gap-5">
                <div className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-1.5 cursor-not-allowed text-sm font-medium capitalize
                  ${i?.status === 'pending' ? 'border-yellow-500 text-yellow-400' : i?.status === 'accepted' ? 'border-green-500 text-green-500' : ''}`}>
                  {i?.status || "Null"}
                </div>

                {isOwner && i?.status === 'pending' && (
                  <button
                    onClick={() => cancel_invitation(i?._id?.toString())}
                    type="button"
                    className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-1.5 text-sm duration-200 ${theme === "dark"
                      ? "border-slate-600 text-slate-200 hover:bg-[#2A2A2D]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                  >
                    <X className="mt-1 lg:mt-0.5" color="red" size={18} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>

            <hr className={`border-0 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`} />
          </div>
        )) : (
          <div className={`py-15 text-center text-[14.5px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            No invitations sent yet
          </div>
        )
      )}
    </div>
  )
}

export default Sended_Invtations