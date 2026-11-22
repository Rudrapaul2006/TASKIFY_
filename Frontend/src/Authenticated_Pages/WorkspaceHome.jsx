import { setWorkspaceMembers, setWorkspaceMembersCount, update_workspace_data } from "@/Redux_Store/workspaceSlice"
import axios from "axios"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import { IoLockClosedOutline } from "react-icons/io5";
import { TbWorld } from "react-icons/tb"
import { ArrowRight, Eye, EyeClosed, Mail, Pencil, UserPlus, Users } from "lucide-react"
import toast from "react-hot-toast"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { GoEyeClosed } from "react-icons/go";
import get_activity from "@/Workspace_Hooks/get_activity"
import { Activity_Action_Message } from "@/Authenticated_Components/workspace_activity_component/Activity_Action_Message"
import { Activity_Time } from "@/Authenticated_Components/workspace_activity_component/Activity_Time"
import { Activity_Date } from "@/Authenticated_Components/workspace_activity_component/Activity_Date"
import { FcRight } from "react-icons/fc"


const WorkspaceHome = () => {
  let params = useParams()
  let workspace_id = params.id

  let { workspace, workspace_activity , workspace_activity_loading , workspaceMembers, workspaceMembersCount, selected_workspace } = useSelector(state => state.workspace)
  let { theme } = useSelector(state => state.theme)
  let dark = theme === "dark"

  let active_workspace_id = workspace_id || selected_workspace

  let refetch_activity = get_activity(active_workspace_id)

  let dispatch = useDispatch()
  let navigate = useNavigate()

  // for showing and hiding the find code :
  let [show_findcode, set_show_findcode] = useState(false)


  // fetch current workspace_data
  let [c_workspace_data, set_c_workspace_data] = useState({})
  let [c_loading, set_c_loading] = useState(true)

  let current_workspace = workspace?.find(ws => (ws?.workspace?._id || ws?._id)?.toString() === active_workspace_id?.toString()) || c_workspace_data[0]
  let isOwner = (c_workspace_data[0]?.role || current_workspace?.role) === "workspace_owner"
  let isMember = (c_workspace_data[0]?.role || current_workspace?.role) === "workspace_member"

  useEffect(() => {
    if (!active_workspace_id) return

    set_c_loading(true)
    set_c_workspace_data({})

    let fetch_current_workspace_data = async () => {
      try {
        let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/get/${active_workspace_id}`, { withCredentials: true })
        if (res.data.success) {
          set_c_workspace_data(res.data.workspace)
        }
      } catch (error) {
        console.log(error)
      } finally {
        setTimeout(() => { set_c_loading(false) }, 500)
      }
    }

    fetch_current_workspace_data()
  }, [active_workspace_id])


  // open edit div
  let [openEditDiv, setOpenEditDiv] = useState(false)

  useEffect(() => {
    setOpenEditDiv(false)
  }, [active_workspace_id, dispatch])


  // update workspace details :
  let [update_loading, set_update_loading] = useState(false)

  let [name, setName] = useState('')
  let [description, setDescription] = useState('')
  let [file, setFile] = useState(null)

  let update_workspace_details = async (e) => {
    e.preventDefault()

    if (!active_workspace_id) return

    let formdata = new FormData()

    if (name.trim()) { formdata.append("name", name.trim()) }
    formdata.append("description", description.trim())
    if (file) { formdata.append("logo", file) }

    try {
      set_update_loading(true)
      let res = await axios.put(`${import.meta.env.VITE_workspace_endpoint}/update/${active_workspace_id}`, formdata, { withCredentials: true })

      if (res.data?.success) {
        if (res.data.updatedWorkspace) {
          let updatedWs = res.data.updatedWorkspace
          set_c_workspace_data((prev) => {
            if (Array.isArray(prev) && prev.length > 0) {
              return [ { ...prev[0], workspace: { ...prev[0]?.workspace, ...updatedWs } }, ...prev.slice(1) ]
            }
            return [{ workspace: updatedWs }]
          })

          dispatch(update_workspace_data(updatedWs))

          await refetch_activity(true)
        }
        toast.success(res.data.message)

        setName('')
        setDescription('')
        setFile(null)
        setOpenEditDiv(false)
      }

    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Something went wrong while updating workspace details")
    } finally {
      set_update_loading(false)
    }
  }


  // update workspace visibility :
  let [visibility_loading, set_visibility_loading] = useState(false)

  let toggle_visibility = async () => {
    if (!active_workspace_id) return

    if (!isOwner) {
      toast.error("Only the workspace owner can change visibility")
      return
    }

    let current_privacy = c_workspace_data[0]?.workspace?.privacy || current_workspace?.workspace?.privacy || "private"
    let new_privacy = current_privacy === "private" ? "public" : "private"

    try {
      set_visibility_loading(true)
      let res = await axios.patch(`${import.meta.env.VITE_workspace_endpoint}/update_privacy/${active_workspace_id}`, { privacy: new_privacy }, { withCredentials: true })

      if (res.data?.success) {
        let updatedWs = res.data.updatedWorkspace
        let wsId = (updatedWs?._id || active_workspace_id)?.toString()

        set_c_workspace_data((prev) => {
          if (Array.isArray(prev) && prev.length > 0) {
            return [
              { ...prev[0], workspace: { ...prev[0]?.workspace, ...updatedWs, privacy: new_privacy } },
              ...prev.slice(1)
            ]
          }
          return [{ workspace: { ...updatedWs, privacy: new_privacy } }]
        })

        dispatch(update_workspace_data({ _id: wsId, ...updatedWs, privacy: new_privacy }))

        await refetch_activity(true) // after visibility update , it refetch the activities

        toast.success(res.data.message || `Workspace visibility updated to ${new_privacy}`)
      }
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Failed to update workspace visibility")
    } finally {
      set_visibility_loading(false)
    }
  }

  // Get Members of each workspace :
  useEffect(() => {
    if (!active_workspace_id) return

    let getAllMembers = async () => {
      try {
        let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/get_all_members/${active_workspace_id}`, { withCredentials: true })

        if (res.data.success) {
          dispatch(setWorkspaceMembers(res.data.allMembers))
          dispatch(setWorkspaceMembersCount(res.data.membersCount))
        }
      } catch (error) {
        console.log(error)
      }
    }

    getAllMembers()
  }, [dispatch, active_workspace_id])


  let inputCls = `text-xs w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${dark ? "border-[#3A3A3D] bg-[#2A2A2D] text-slate-100" : "border-[#E5E7EB] bg-white text-slate-900"}`
  let labelCls = `text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`
  let bg = `animate-pulse ${dark ? "bg-[#2A2A2D]" : "bg-[#E5E7EB]"}`
  let Skeleton = ({ className = "" }) => <div className={`${bg} ${className}`} />

  return (
    <>
      {c_loading ? (
        <>
          {/* 1. Header Skeleton */}
          <div className={`flex flex-col gap-3 pb-4 border-b ${dark ? "border-[#3A3A3D]" : "border-[#E5E7EB]"}`}>
            <div className="flex items-center justify-between sm:justify-between md:justify-start lg:justify-start md:gap-10 lg:gap-10">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Skeleton className="h-6 w-25 sm:w-48 md:w-56 lg:w-64 rounded-md" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3.5 w-14 sm:w-16 rounded" />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-0.5">
              <Skeleton className="h-4 w-48 sm:w-64 md:w-80 lg:w-96 max-w-full rounded" />
            </div>
          </div>

          <div className="flex w-full flex-col gap-6 lg:gap-7 lg:flex-row">

            <div className="flex min-w-0 w-full flex-1 flex-col">
              {/* Cards Skeleton */}
              <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 lg:gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex min-w-0 items-center rounded-xl border p-5 shadow-sm sm:p-5 lg:p-5 ${dark ? "border-[#3A3A3D] bg-[#1F1F21]" : "border-[#E5E7EB] bg-white"}`}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-8 w-12 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Settings Card Skeleton */}
              <div className={`w-full mt-8 sm:mt-10 rounded-lg border px-3 py-3 sm:px-4 ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>
                <Skeleton className="h-6 w-full lg:w-48 rounded" />
                <div className={`mt-3 divide-y ${dark ? "divide-[#343437]" : "divide-slate-200"}`}>
                  {isOwner && (
                    <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <Skeleton className="h-4 w-20 lg:w-36 rounded" />
                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  )}
                  {isMember && (
                    <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-4 w-28 rounded" />
                    </div>
                  )}
                  {isMember && (
                    <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-4 w-28 rounded" />
                    </div>
                  )}
                  <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <Skeleton className="h-4 w-20 rounded" />
                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                      <Skeleton className="h-4 w-16 rounded" />
                      {isOwner && <Skeleton className="h-7 w-12 rounded-full" />}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                </div>
              </div>
            </div>

            <aside className={`mt-2.5 w-full min-h-64 rounded-lg border p-4 lg:mt-8 lg:w-80 lg:shrink-0 xl:w-[32.5rem] ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>
              <div className={`flex items-center justify-between border-b pb-2 ${dark ? "border-white/10" : "border-slate-200"}`}>
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>

              <div className="mt-2 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${dark ? "border-white/10 bg-[#1F1F21]" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                      <div className="flex min-w-0 flex-col gap-1.5">
                        {/* <Skeleton className="h-3.5 w-32 max-w-full rounded" /> */}
                        <Skeleton className="h-3 w-15 lg:w-75 max-w-full rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-12 shrink-0 rounded" />
                  </div>
                ))}
              </div>
            </aside>

          </div>

          {/* Action & Danger Zone Skeleton */}
          {isOwner && (
            <div className="mt-8 sm:mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className={`flex w-full shrink-0 flex-col items-stretch justify-center gap-2 rounded-lg border p-3 sm:flex-row lg:w-auto lg:px-4 lg:py-3 ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>
                <Skeleton className="h-full w-full sm:w-44 rounded-md" />
                <Skeleton className="h-full w-full sm:w-44 rounded-md" />
                <Skeleton className="h-full w-full sm:w-44 rounded-md" />
              </div>

              <div className={`min-w-0 flex-1 rounded-lg border p-4 ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>
                <Skeleton className="h-5 w-28 rounded" />
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-40 max-w-full rounded" />
                    <Skeleton className="h-3.5 w-64 max-w-full rounded" />
                  </div>
                  <Skeleton className="h-9 w-36 shrink-0 rounded-md" />
                </div>
              </div>
            </div>
          )}

          {isMember && (
            <div className="mt-8 sm:mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className={`flex w-full shrink-0 flex-col items-stretch justify-center gap-2 rounded-lg border p-3 sm:flex-row lg:w-auto lg:px-4 lg:py-3 ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>
                <Skeleton className="h-9 w-full sm:w-40 rounded-md" />
              </div>

              <div className={`min-w-0 flex-1 rounded-lg border p-4 ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>
                <Skeleton className="h-5 w-36 rounded" />
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Skeleton className="h-4 w-64 max-w-full rounded" />
                  <Skeleton className="h-9 w-36 shrink-0 rounded-md" />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Workspace details */}
          {openEditDiv === false && (
            <div className={`flex flex-col gap-3 pb-4 border-b ${dark ? "border-[#3A3A3D]" : "border-[#E5E7EB]"}`}>

              <div className="flex items-center justify-between sm:justify-between md:justify-start lg:justify-start md:gap-10 lg:gap-10">
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  {c_workspace_data[0]?.workspace?.logo || current_workspace?.workspace?.logo ? (
                    <img
                      src={c_workspace_data[0]?.workspace?.logo || current_workspace?.workspace?.logo}
                      alt={c_workspace_data[0]?.workspace?.name || current_workspace?.workspace?.name}
                      className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-[#3A3A3D]"
                    />
                  ) : (
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border text-xl font-bold ${dark ? "border-blue-400 bg-blue-600 text-white" : "border-blue-400 bg-blue-400 text-black"}`}>
                      {(c_workspace_data[0]?.workspace?.name || current_workspace?.workspace?.name || "W")?.trim().charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex min-w-0 flex-col gap-0">
                    <span className="truncate text-xl font-bold">{c_workspace_data[0]?.workspace?.name || current_workspace?.workspace?.name}</span>
                    <div className="flex items-center gap-2">
                      {(c_workspace_data[0]?.workspace?.privacy || current_workspace?.workspace?.privacy) !== "public" ? <IoLockClosedOutline size={18} color="red" className="shrink-0 mt-0.5" /> : <TbWorld size={18} color="green" className="shrink-0 mt-1" />}
                      <span className="text-sm font-semibold leading-none">{c_workspace_data[0]?.workspace?.privacy || current_workspace?.workspace?.privacy}</span>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <button
                    onClick={() => {
                      let ws = c_workspace_data[0]?.workspace || current_workspace?.workspace

                      setName(ws?.name || '')
                      setDescription(ws?.description || '')
                      setFile(null)
                      setOpenEditDiv(true)
                    }}
                    aria-label="Edit workspace"
                    className={`z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${dark
                      ? "border-[#3A3A3D] bg-[#232326] text-slate-300 hover:bg-[#2A2A2D] hover:text-blue-400" : "border-[#E5E7EB] bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>

              <div className="text-[15px] font-semibold"> {c_workspace_data[0]?.workspace?.description || "Description ..."} </div>

            </div>
          )}

          {/* Workspace update div */}
          {openEditDiv === true && (
            <>
              <form
                onSubmit={update_workspace_details}
                className="flex w-full max-w-md flex-col gap-3 pb-5"
              >
                <div className="flex flex-col gap-2">
                  <label className={labelCls}> Name </label>
                  <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Description (optional)</label>
                  <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={1} className={inputCls} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Logo (optional)</label>

                  <input
                    id="workspace-logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />

                  <div
                    className={`flex h-10 overflow-hidden rounded-lg border ${dark ? "border-[#3A3A3D] bg-[#2A2A2D]" : "border-[#E5E7EB] bg-white"}`}
                  >
                    <label
                      htmlFor="workspace-logo"
                      className={`flex cursor-pointer items-center border-r px-4 text-sm font-semibold ${dark ? "border-[#3A3A3D] text-slate-100 hover:bg-[#343437]" : "border-[#E5E7EB] text-slate-800 hover:bg-slate-50"}`}
                    >
                      Choose logo
                    </label>

                    <span className={`flex min-w-0 flex-1 items-center truncate px-3 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`} >
                      {file?.name || "No file chosen"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={update_loading}
                    className="rounded-lg bg-blue-500 px-4 py-1.5 text-base font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                  >
                    {update_loading ? "Saving..." : "Save"}
                  </button>

                  <button type="button"
                    onClick={() => {
                      setName('')
                      setDescription('')
                      setFile(null)
                      setOpenEditDiv(false)
                    }}
                    className={`rounded-lg border px-4 py-1.5 text-base transition-colors cursor-pointer ${dark ? "border-[#3A3A3D] bg-[#232326] text-slate-300 hover:bg-[#2A2A2D] " : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <hr className={`w-full border-t ${dark ? "border-[#3A3A3D]" : "border-[#E5E7EB]"}`} />
            </>
          )}

          {/* cards + workspace details */}
          <div className="flex w-full flex-col gap-6 lg:gap-7 lg:flex-row">

            <div className="flex min-w-0 w-full flex-1 flex-col">
              {/* Cards */}
              <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 lg:gap-5">
                {[
                  { content: "All Members", value: workspaceMembersCount },
                  { content: "Total Organizations", value: '_' },
                  { content: "Total Tasks", value: '_' },
                  { content: "Completed Tasks", value: '_' }
                ].map(({ content, value }) => (

                  <div
                    key={content}
                    className={`flex min-w-0 items-center rounded-xl border p-5 shadow-sm sm:p-5 lg:p-5 ${dark ? "border-[#3A3A3D] bg-[#1F1F21]" : "border-[#E5E7EB] bg-white"}`}
                  >
                    <div>
                      <p className={`text-[15px] font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>{content}</p>
                      <p className={`mt-2 text-3xl font-bold leading-none tracking-tight ${dark ? "text-slate-100" : "text-slate-800"}`}>
                        {value}
                      </p>
                    </div>
                  </div>

                ))}
              </div>

              {/* visibility and workspace settings */}
              <div className={`w-full mt-8 sm:mt-8 rounded-lg border px-3 py-3 sm:px-4 ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>
                <h3 className={`text-base font-bold sm:text-[17px] ${dark ? "text-slate-100" : "text-slate-700"}`}>
                  {isOwner ? "Workspace Details & Settings" : "Workspace Details"}
                </h3>

                <div className={`mt-3 divide-y ${dark ? "divide-[#343437]" : "divide-slate-200"}`}>
                  {isOwner && <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Workspace Join Code</span>

                    <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:gap-5">
                      {
                        show_findcode === true && <span className={`min-w-0 break-all font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>
                          {c_workspace_data[0]?.workspace?.findCode || active_workspace_id || "—"}
                        </span>
                      }
                      <button
                        type="button"
                        aria-label={show_findcode ? "Hide workspace join code" : "Show workspace join code"}
                        onClick={() => set_show_findcode(!show_findcode)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${dark ? "text-slate-300 hover:bg-[#343437]" : "text-slate-600 hover:bg-blue-200"}`}
                      >
                        {show_findcode ? <span className={`flex items-center justify-center rounded w-8 h-8 ${dark ? "bg-[#343437]" : "bg-blue-200"}`}><GoEyeClosed color={`${dark ? "" : "black"}`} size={18} /></span> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>}

                  {isMember && <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Workspace Owner</span>

                    <span className={`min-w-0 break-all font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>
                      {c_workspace_data[0]?.workspace?.workspaceOwner?.name || "—"}
                    </span>
                  </div>}

                  {isMember && <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Join Date</span>
                    <span className={`font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>
                      {(c_workspace_data[0]?.joinedAt || c_workspace_data[0]?.createdAt)
                        ? new Date(c_workspace_data[0]?.joinedAt || c_workspace_data[0]?.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : "—"}
                    </span>
                  </div>}

                  <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Visibility</span>
                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                      <span className={`font-semibold capitalize ${dark ? "text-slate-200" : "text-slate-700"}`}>
                        {c_workspace_data[0]?.workspace?.privacy || current_workspace?.workspace?.privacy || "private"}
                      </span>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={(c_workspace_data[0]?.workspace?.privacy || current_workspace?.workspace?.privacy) === "public"}
                        hidden={!isOwner}
                        onClick={toggle_visibility}
                        aria-label="Toggle workspace visibility"
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 
                      ${(c_workspace_data[0]?.workspace?.privacy || current_workspace?.workspace?.privacy) === "public" ? "bg-indigo-600" : dark ? "bg-[#343437]" : "bg-slate-300"}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-1 ${(c_workspace_data[0]?.workspace?.privacy || current_workspace?.workspace?.privacy) === "public" ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Created Date</span>
                    <span className={`font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>
                      {c_workspace_data[0]?.workspace?.createdAt
                        ? new Date(c_workspace_data[0]?.workspace.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <aside className={`mt-2.5 w-full min-h-64 rounded-lg border p-4 lg:mt-8 lg:w-80 lg:shrink-0 xl:w-[32.5rem] ${dark ? "border-[#3A3A3D] bg-[#1d1d1f]" : "border-[#E5E7EB] bg-white"}`}>

              <div className={`flex items-center justify-between border-b pb-2 ${dark ? "border-white/10" : "border-slate-200"}`}>
                <h3 className={`text-base font-bold ${dark ? "text-slate-100" : "text-slate-700"}`}>Recent Activity</h3>

                <button 
                onClick={() => navigate(`/workspace/activity/${selected_workspace}`)}
                className={`flex items-center justify-center gap-2 rounded-md border px-2 py-1 text-sm transition-colors duration-150 cursor-pointer ${dark ? "border-white/10 text-slate-300 hover:bg-[#222224]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  View all
                  <FcRight aria-hidden="true" className="shrink-0" />
                </button>
              </div>

              {(c_loading || workspace_activity_loading) === false && (
                <div className="mt-2 h-auto space-y-2 overflow-hidden">
                  {workspace_activity.length > 0 ? workspace_activity?.slice(0, 4)?.map((i, index) => {
                    let actorName = i?.actor?.name || i?.actor?.email || i?.targetUser?.name || i?.targetUser?.email || (i?.type?.toLowerCase().includes("org settings") ? "System Admin" : "Owner")
                    let actionText = Activity_Action_Message(i)
                    let timeAgo = Activity_Time(i?.createdAt)
                    let avatarUrl = i?.actor?.avatar || i?.targetUser?.avatar || i?.meta?.avatar
                    let firstLetter = (actorName || i?.targetUser?.name || "U").trim().charAt(0).toUpperCase()

                    return (
                      <div
                        key={i?._id || index}
                        className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors
                        ${dark ? "border-white/10 bg-[#1F1F21] text-white" : "border-gray-200 bg-white text-gray-900 shadow-xs"}`}
                      >
                        <div className="flex flex-col lg:flex-row items-start min-w-0 lg:items-center gap-3">
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

                          <div className="min-w-0 text-sm leading-tight">
                            <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                              {actorName}{" "}
                            </span>
                            <span className={dark ? "text-slate-300" : "text-slate-600"}>
                              {actionText}
                            </span>
                          </div>
                        </div>

                        <span className={`shrink-0 text-right text-xs font-normal whitespace-nowrap ${dark ? "text-gray-400" : "text-gray-500"}`}>
                          {timeAgo}
                        </span>
                      </div>
                    )
                  }) : (
                    <div className={`mt-4 flex h-55 lg:h-59 items-center justify-center rounded-md border border-dashed px-4 text-center text-sm ${dark ? "border-[#3A3A3D] text-slate-500" : "border-slate-200 text-slate-400"}`}>
                      No activity yet
                    </div>
                  )}
                </div>
              )}
            </aside>

          </div>

          {/* workspace deletation */}
          {isOwner && (
            <div className="mt-8 sm:mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch">

              <div className={`flex w-full shrink-0 flex-col items-stretch justify-center gap-2 rounded-lg border p-3 sm:flex-row lg:w-auto lg:px-4 lg:py-3 ${dark ? "border-[#343437] bg-[#1d1d1f]" : "border-slate-200 bg-white"}`}>
                <button onClick={() => {
                  localStorage.setItem(`workspace_tab:${active_workspace_id}`, "members")
                  navigate(`/workspace/members/${active_workspace_id}?active_tab=members`)
                }} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm font-medium transition cursor-pointer  ${dark ? "border-[#343437] text-slate-200 hover:bg-[#343437]" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                  <span className="flex items-center gap-2"><Users aria-hidden="true" size={16} /> View members</span> <ArrowRight aria-hidden="true" size={16} />
                </button>
                <button onClick={() => {
                  localStorage.setItem(`workspace_tab:${active_workspace_id}`, "invitation");
                  navigate(`/workspace/members/${active_workspace_id}?active_tab=invitation`)
                }} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm font-medium transition  cursor-pointer ${dark ? "border-[#343437] text-slate-200 hover:bg-[#343437]" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                  <span className="flex items-center gap-2"><Mail aria-hidden="true" size={16} /> View Invitations</span> <ArrowRight aria-hidden="true" size={16} />
                </button>
                <button onClick={() => {
                  localStorage.setItem(`workspace_tab:${active_workspace_id}`, "joinRequest");
                  navigate(`/workspace/members/${active_workspace_id}?active_tab=joinRequest`)
                }} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm font-medium transition cursor-pointer  ${dark ? "border-[#343437] text-slate-200 hover:bg-[#343437]" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                  <span className="flex items-center gap-2"><UserPlus aria-hidden="true" size={16} /> View Join Requests</span> <ArrowRight aria-hidden="true" size={16} />
                </button>
              </div>

              {/* Delete Button */}
              <div className={`mt-4.5 lg:mt-0 min-w-0 flex-1 rounded-lg border p-4 ${dark ? "border-red-500/40 bg-[#1d1d1f]" : "border-red-200 bg-white"}`}>
                <h3 className="text-base font-semibold text-red-500">Danger Zone</h3>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                      Delete this workspace
                    </p>
                    <p className={`text-sm ${dark ? "text-[#9CA3AF]" : "text-slate-500"}`}>
                      Permanently removes all organizations, boards and tasks. This can't be undone
                    </p>
                  </div>

                  <button
                    className="shrink-0 rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500 cursor-pointer hover:text-white"
                  >
                    Delete workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {isMember && (
            <div className="mt-8 sm:mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className={`flex w-full shrink-0 flex-col items-stretch justify-center gap-2 rounded-lg border p-3 sm:flex-row lg:w-auto lg:px-4 lg:py-3 ${dark ? "border-[#343437] bg-[#1d1d1f]" : "border-slate-200 bg-white"}`}>
                <button onClick={() => {
                  localStorage.setItem(`workspace_tab:${active_workspace_id}`, "members")
                  navigate(`/workspace/members/${active_workspace_id}?active_tab=members`)
                }} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm font-medium transition cursor-pointer ${dark ? "border-[#343437] text-slate-200 hover:bg-[#343437]" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                  <span className="flex items-center gap-2"><Users aria-hidden="true" size={16} /> View members</span>
                  <ArrowRight aria-hidden="true" size={16} />
                </button>
              </div>

              <div className={`min-w-0 flex-1 rounded-lg border p-4 ${dark ? "border-red-500/40 bg-[#1d1d1f]" : "border-red-200 bg-white"}`}>
                <h3 className="text-base font-semibold text-red-500">Leave Workspace</h3>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className={`text-sm ${dark ? "text-[#9CA3AF]" : "text-slate-500"}`}>Leave this workspace and lose access to its content</p>
                  <button
                    className="shrink-0 rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500 cursor-pointer hover:text-white"
                  >
                    Leave workspace
                  </button>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </>
  )
}

export default WorkspaceHome