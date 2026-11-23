﻿﻿import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, X } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { get_invitation } from '@/Workspace/Workspace_Hooks/get_all_invitations'
import toast from 'react-hot-toast'
import {
  decline_invitation, set_pending_invitation_search, set_pending_invitation_sorting,
  set_workspace_invitations_loading
} from '@/Redux_Store/workspaceSlice'
import Invitation_History from './Invitations_History'
import get_all_members from '@/Workspace/Workspace_Hooks/get_all_members'

const Sended_Invtations = () => {
  let dispatch = useDispatch()
  let navigate = useNavigate()
  let params = useParams()
  let workspace_id = params.id

  let { workspace, workspace_invitations, workspace_invitations_loading, pending_invitation_search, pending_invitation_sorting } = useSelector(state => state.workspace)
  let { theme } = useSelector(state => state.theme)

  let currentWorkspace = workspace.find(ws => ws?.workspace?._id === workspace_id)
  let isOwner = currentWorkspace?.role === 'workspace_owner'
  let isMember = currentWorkspace?.role === 'workspace_member'


  // History flash on url :
  let [activeInvitationActivity, setInvitationActivity] = useState('')
  
  // Get Workspace Invitations [hook]
  get_invitation(workspace_id, activeInvitationActivity)
  get_all_members(workspace_id, 'invitation')

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


  let chipBase = "cursor-pointer rounded-xl border px-4 py-1 text-sm font-medium transition-all duration-200 shrink-0 inline-flex items-center justify-center"
  let chipInactive = theme === "dark" ? "border-slate-500 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400" : "border-slate-400 text-slate-600 hover:bg-slate-100 hover:border-slate-600"



  return (
    <div className="w-full">

      {!activeInvitationActivity && (
        <div className={`sticky top-[107.5px] sm:top-[115px] z-[40] pt-2.5 pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 ${theme === "dark" ? "bg-[#1a1a1b]" : "bg-gray-50"}`}>

          {/* Activity & Clear buttons */}
          {isOwner && (
            <div className="mb-2.5 flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setInvitationActivity('invitationActivity')}
                className={`${chipBase} ${chipInactive}`}
              >
                Activity
              </button>

              {activeInvitationActivity &&
                <button
                  type="button"
                  onClick={() => {
                    dispatch(set_pending_invitation_search(''))
                    dispatch(set_pending_invitation_sorting(''))
                    setInvitationActivity('')
                    navigate(`/workspace/members/${workspace_id}?active_tab=invitation`, { replace: true })
                  }}
                  className={`${chipBase} gap-2 border-red-500 text-red-500 hover:border-red-400 hover:bg-red-500/10`}
                >
                  <X className="mt-0.5" size={16} aria-hidden="true" />
                  Clear
                </button>}
            </div>
          )}

          <hr className={`mb-3 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`} />

          {/* searching and sorting */}
          {(isOwner || isMember) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start">

              <div className="relative w-full lg:max-w-80 lg:flex-none">
                <Search size={17}
                  className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`} />

                <input
                  type="text"
                  value={pending_invitation_search}
                  onChange={(e) => {
                    dispatch(set_pending_invitation_search(e.target.value))
                    dispatch(set_pending_invitation_sorting(''))
                  }}
                  placeholder="Search name or email"
                  className={`h-10 w-full rounded-xl border pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                    ${theme === "dark" ? "border-white/10 bg-[#2A2A2D] text-white placeholder:text-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"}`}
                />
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={pending_invitation_sorting}
                  onChange={(e) => {
                    dispatch(set_pending_invitation_sorting(e.target.value))
                    dispatch(set_pending_invitation_search(''))
                  }}
                  className={`h-10 w-full rounded-xl border px-3 outline-none sm:w-50 ${theme === "dark" ? "border-white/10 bg-[#2A2A2D] text-white focus:ring focus:ring-blue-500" : "border-slate-300 bg-white text-slate-900 focus:ring focus:ring-blue-500"}`}
                >
                  <option value="">Sort</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
              
            </div>
          )}

          <hr className={`mt-3 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`} />
        </div>
      )}


      {/* history of invitation page */}
      {activeInvitationActivity && <Invitation_History onClear={() => setInvitationActivity('')} />}


      {!activeInvitationActivity && (
        workspace_invitations_loading ? (

          <div className="flex justify-center py-14" role="status" aria-label="Loading invitations">
            <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-slate-500" : "border-blue-600"}`} />
          </div>

        ) : workspace_invitations.length > 0 ? workspace_invitations?.map((i) => (

          <div
            key={i?._id || i?.id}
            className={`mt-3 overflow-hidden rounded-md border ${theme === "dark" ? "border-white/10 bg-transparent text-white" : "border-slate-200 bg-white text-slate-900"}`}
          >
            <div
              className="flex flex-col justify-between gap-4 py-3.5 sm:flex-row sm:items-center px-3 lg:px-2"
            >
              <div className="ml-1 flex min-w-0 items-center gap-3">
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
                  ${i?.status === 'pending' ? 'border-yellow-600 bg-yellow text-yellow-500' : i?.status === 'accepted' ? 'border-green-500 bg-green-500/10 text-green-500' : ''}`}>
                  {i?.status || "Null"}
                </div>

                {isOwner && i?.status === 'pending' && (
                  <button
                    onClick={() => cancel_invitation(i?._id?.toString())}
                    type="button"
                    className={`mr-1 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-1.5 text-sm duration-200 ${theme === "dark"
                      ? "border-slate-600 text-slate-200 hover:bg-[#2A2A2D]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                  >
                    <X className="mt-1 lg:mt-0.5" color="red" size={18} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>

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