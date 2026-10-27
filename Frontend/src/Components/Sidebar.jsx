import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Users, ChevronRight, ChevronLeft, Activity, ChevronDown, Plus, X, Check, Lock, Globe, Home } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog";
import axios from "axios";
import { setAddWorkspace } from "@/Redux_Store/workspaceSlice";
import toast from "react-hot-toast";
import getAllWorkspace from "@/Workspace_Hooks/getAllWorkspace";
import { useNavigate, useLocation, useParams } from "react-router-dom";

const Sidebar = () => {
    getAllWorkspace()

    let dispatch = useDispatch()
    let navigate = useNavigate()
    let location = useLocation()
    let { id: routeWsId } = useParams()

    let [isOpen, setIsOpen] = useState(true) // for sidebar
    let [isDropdownOpen, setIsDropdownOpen] = useState(false) // for workspace


    let { theme } = useSelector((state) => state.theme)
    let { workspace } = useSelector((state) => state.workspace)

    // Keep the selected workspace in memory & localStorage
    let [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() =>
        typeof window !== "undefined" ? window.localStorage.getItem("selectedWorkspaceId") : null
    )

    // Sync selectedWorkspaceId if route has an id that belongs to user workspaces
    useEffect(() => {
        if (routeWsId && routeWsId !== selectedWorkspaceId) {
            let exists = workspace?.some((ws) => {
                let wsData = ws?.workspace || ws
                return (wsData?._id || ws?._id) === routeWsId
            })
            if (exists) {
                setSelectedWorkspaceId(routeWsId)
            }
        }
    }, [routeWsId, workspace, selectedWorkspaceId])


    useEffect(() => {
        if (selectedWorkspaceId) {
            window.localStorage.setItem("selectedWorkspaceId", selectedWorkspaceId)
        }
    }, [selectedWorkspaceId])



    let dark = theme === "dark"
    let divider = `mx-2 my-2 h-px ${dark ? "bg-[#3A3A3D]" : "bg-[#E5E7EB]"}`
    let linkBtn = `flex items-center gap-3 w-full rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${dark ? "hover:bg-[#2A2A2D] hover:text-white text-slate-400" : "hover:bg-gray-200 hover:text-[#0F172A] text-slate-500"}`


    // Derive active workspace
    let activeWs = workspace?.find((ws) => {
        let wsData = ws?.workspace || ws
        let wsId = wsData?._id || ws?._id

        return wsId === selectedWorkspaceId
    }) || workspace?.[0] || null

    let activeWsData = activeWs?.workspace || activeWs
    let activeWsId = activeWsData?._id || activeWs?._id
    let activeWsName = activeWsData?.name || activeWs?.name || "No workspace"

    // Integrate create workspace api :
    let [isDialogOpen, setIsDialogOpen] = useState(false)



    let [workspaceName, setWorkspaceName] = useState('')
    let [privacy, setPrivacy] = useState('private')
    let [image, setImage] = useState(null)

    let [isSubmitting, setIsSubmitting] = useState(false)


    // create workspace
    let uploadHandler = async (e) => {
        e.preventDefault()

        if (!workspaceName.trim()) {
            toast.error("Please provide a valid workspace name")
            return
        }

        let formData = new FormData();
        formData.append('workspace_name', workspaceName.trim())
        formData.append('privacy', privacy || 'private')
        if (image) {
            formData.append('logo', image)
        }

        try {
            setIsSubmitting(true)
            let res = await axios.post(`${import.meta.env.VITE_workspace_endpoint}/create`, formData, { withCredentials: true })

            if (res.data.success) {
                let createdWs = res.data.createdWorkspace
                dispatch(setAddWorkspace(createdWs))

                let createdWsData = createdWs?.workspace || createdWs
                let createdWsId = createdWsData?._id || createdWs?._id
                if (createdWsId) {
                    setSelectedWorkspaceId(createdWsId)
                    navigate(`/workspace/home/${createdWsId}`)
                }

                setWorkspaceName('')
                setPrivacy('private')
                setImage(null)

                setIsDialogOpen(false)

                toast.success(res.data.message || "Workspace created successfully")
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || 'Error in creating workspace')
        } finally {
            setIsSubmitting(false)
        }
    }


    // Redirect to active workspace home if on /authenticatedhome or /home:
    useEffect(() => {
        if (!activeWsId) return

        if (location.pathname === '/authenticatedhome' || location.pathname === '/home') {
            navigate(`/workspace/home/${activeWsId}`, { replace: true })
        }
    }, [activeWsId, location.pathname, navigate])


    return (
        <div className={`relative h-full shrink-0 transition-all duration-300 ${isOpen ? "w-35 sm:w-60 lg:w-[260px]" : "w-[35px]"}`} >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen((p) => !p)}
                className={`absolute right-0 top-12 z-20 flex h-6 w-6 translate-x-1/2 items-center justify-center rounded-full border shadow-md transition-all duration-300 cursor-pointer
                    ${dark ? "border-[#3A3A3D] bg-[#2A2A2D] text-slate-100 hover:bg-[#3A3A3D]" : "border-[#E5E7EB] bg-white text-slate-700 hover:bg-gray-100"}`}
            >
                {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            <div
                className={`h-full flex flex-col select-none ${dark ? "bg-[#1F1F21] border-r border-[#3A3A3D] text-slate-100" : "bg-[#FAFAFA] border-r border-[#E5E7EB] text-slate-800"}`}
            >
                {!isOpen ? (
                    /* Collapsed state (40px width): show only the active workspace avatar. Clicking it expands the sidebar. */
                    <div className="flex flex-col items-center pt-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            title={activeWsName}
                            className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white transition hover:opacity-90 cursor-pointer shadow-xs"
                        >
                            {activeWsName?.[0]?.toUpperCase() || "W"}
                        </button>
                    </div>
                ) : (

                    <div className="flex flex-col h-full">
                        {/* Workspace Dropdown */}
                        <div className="relative px-2 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen((p) => !p)}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${isDropdownOpen ? (dark ? "bg-[#2A2A2D] text-white" : "bg-gray-100 text-slate-900") : (dark ? "hover:bg-[#2A2A2D] text-slate-200" : "hover:bg-gray-100 text-slate-800")}`}
                            >
                                {activeWsData?.logo ? (
                                    <img
                                        src={activeWsData?.logo}
                                        alt=""
                                        className="h-6 w-6 shrink-0 rounded object-cover"
                                    />
                                ) : (
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                                        {activeWsName?.[0]?.toUpperCase() || "W"}
                                    </span>
                                )}

                                <span className="flex-1 truncate text-sm font-medium">
                                    {activeWsName}
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`shrink-0 transition-transform duration-200 ${dark ? "text-slate-400" : "text-slate-500"} ${isDropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    {/* Invisible backdrop: bahar click karte hi dropdown band */}
                                    <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />

                                    {/* Dropdown Menu */}
                                    <div
                                        className={`absolute left-2 right-2 top-full z-30 mt-1 flex flex-col rounded-lg border p-1 shadow-lg ${dark ? "border-[#3A3A3D] bg-[#252528] text-slate-100" : "border-[#E5E7EB] bg-white text-slate-800"}`}
                                    >
                                        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                            {workspace && workspace.length > 0 ? (

                                                workspace?.map((ws) => {
                                                    let wsData = ws?.workspace || ws
                                                    let wsId = wsData?._id || ws?._id
                                                    let wsName = wsData?.name || ws?.name || "Workspace"
                                                    let isSelected = wsId === activeWsId

                                                    return (
                                                        <button
                                                            key={wsId}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedWorkspaceId(wsId)
                                                                setIsDropdownOpen(false)

                                                                if (location.pathname.startsWith('/workspace/activity')) {
                                                                    navigate(`/workspace/activity/${wsId}`)
                                                                } else if (location.pathname.startsWith('/workspace/members')) {
                                                                    navigate(`/workspace/members/${wsId}`)
                                                                } else {
                                                                    navigate(`/workspace/home/${wsId}`)
                                                                }
                                                            }}
                                                            className={`flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer ${isSelected
                                                                ? (dark ? "bg-[#2E2F33] text-white" : "bg-gray-100 text-slate-900") : (dark ? "hover:bg-[#2A2A2D] text-slate-300" : "hover:bg-gray-50 text-slate-700")}`}
                                                        >
                                                            {wsData?.logo ? (
                                                                <img
                                                                    src={wsData?.logo}
                                                                    alt=""
                                                                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${dark ? "bg-[#3A3A3D] text-slate-200" : "bg-gray-200 text-slate-700"}`}>
                                                                    {wsName?.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}

                                                            <span className="flex-1 truncate text-left">{wsName}</span>
                                                            {isSelected && (<Check size={14} className={dark ? "text-blue-400" : "text-blue-600"} />)}
                                                        </button>
                                                    )
                                                })
                                            ) : (
                                                <div className="px-2 py-2 text-xs text-slate-400 text-center">
                                                    No workspaces found
                                                </div>
                                            )}
                                        </div>

                                        <div className={`my-1 h-px ${dark ? "bg-[#3A3A3D]" : "bg-[#E5E7EB]"}`} />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDropdownOpen(false)
                                                setIsDialogOpen(true)
                                            }}
                                            className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer ${dark ? "text-slate-300 hover:bg-[#2A2A2D] hover:text-white" : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
                                                }`}
                                        >
                                            <Plus size={15} className="shrink-0" />
                                            <span>Create workspace</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={divider} />

                        {/* Active Workspace Links */}
                        {activeWsId && (
                            <nav className="flex flex-col gap-0.5 px-2 flex-1">

                                <button
                                    type="button"
                                    onClick={() => navigate(`/workspace/home/${activeWsId}`)}
                                    className={`${linkBtn} ${location.pathname.startsWith('/workspace/home') ? (dark ? "bg-[#2A2A2D] text-white" : "bg-gray-200 text-[#172554]") : ""}`}
                                >
                                    <Home size={15} className="shrink-0" />
                                    <span className="whitespace-nowrap">Home</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(`/workspace/activity/${activeWsId}`)}
                                    className={`${linkBtn} ${location.pathname.startsWith('/workspace/activity') ? (dark ? "bg-[#2A2A2D] text-white" : "bg-gray-200 text-[#172554]") : ""}`}
                                >
                                    <Activity size={15} className="shrink-0" />
                                    <span className="whitespace-nowrap">Activity</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(`/workspace/members/${activeWsId}`)}
                                    className={`${linkBtn} ${location.pathname.startsWith('/workspace/members') ? (dark ? "bg-[#2A2A2D] text-white" : "bg-gray-200 text-[#172554]") : ""}`}
                                >
                                    <Users size={15} className="shrink-0" />
                                    <span className="whitespace-nowrap">Members</span>
                                </button>
                            </nav>
                        )}
                    </div>
                )}
            </div>



            {/* Create Workspace Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent
                    showCloseButton={false}
                    className={`z-1001 h-[calc(100dvh-1rem)] max-h-[52rem] w-[calc(100vw-1rem)] sm:h-[min(78vh,52rem)] sm:w-[calc(100vw-2rem)] sm:max-w-5xl overflow-hidden rounded-2xl border p-0 ${dark
                        ? "border-[#3a3a3d] bg-[#2c2d31] text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
                >
                    {/* Close Button */}
                    <DialogClose
                        className={`absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer shadow-md focus:outline-none hover:scale-105 active:scale-95 ${dark
                            ? "border border-slate-600/70 bg-[#282e33]/90 text-slate-300 hover:bg-[#383f45] hover:text-white"
                            : "border border-slate-200/80 bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900"
                            }`}
                    >
                        <X size={16} strokeWidth={2.4} />
                        <span className="sr-only">Close</span>
                    </DialogClose>

                    {/* workspace creation form */}
                    <div className="grid h-full min-h-0 lg:grid-cols-[1.1fr_0.9fr]">

                        <div className="relative z-10 min-h-0 min-w-0 p-4 sm:p-8 lg:p-10">

                            <DialogHeader className="mb-5 pr-9 text-left sm:mb-6 sm:pr-10">
                                <DialogTitle className="text-xl font-bold sm:text-2xl">Create a Workspace</DialogTitle>
                                <DialogDescription className={`mt-2 text-sm sm:text-base ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                    Boost your productivity by making it easier for everyone to access boards in one location.
                                </DialogDescription>
                            </DialogHeader>

                            {/* workspace create form */}
                            <form onSubmit={uploadHandler} className="flex flex-col gap-3 sm:gap-5">

                                <div className="space-y-2">
                                    <label htmlFor="workspace-name" className="text-sm font-semibold">
                                        Workspace name
                                    </label>
                                    <input
                                        id="workspace-name"
                                        placeholder="Taco's Co."
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        required
                                        className={`mt-2 w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${dark
                                            ? "border-slate-500 bg-transparent text-white placeholder:text-slate-400"
                                            : "border-slate-300 bg-white placeholder:text-slate-400"
                                            }`}
                                    />
                                    <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                        This is the name of your company, team or organization.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="workspace-image" className="text-sm font-semibold">
                                        Upload workspace image
                                    </label>
                                    <input
                                        id="workspace-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                                        className={`w-full cursor-pointer rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${dark
                                            ? "border-slate-600 bg-[#252629] text-slate-300 file:border-0 file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600"
                                            : "border-slate-300 bg-white text-slate-600 file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                            } file:mr-4 file:cursor-pointer file:px-4 file:py-2.5 file:font-medium file:transition-colors`}
                                    />
                                    <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                        Choose an image to represent your workspace.
                                    </p>
                                </div>

                                {/* Privacy */}
                                <div className="space-y-2">
                                    <span className="text-sm font-semibold">Privacy</span>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {[{ value: "public", label: "Public", desc: "Anyone can find and request to join", Icon: Globe },
                                        { value: "private", label: "Private", desc: "Only invited members can join", Icon: Lock },
                                        ].map(({ value, label, desc, Icon }) => (
                                            <label key={value} className="cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="privacy"
                                                    value={value}
                                                    checked={privacy === value}
                                                    onChange={(e) => setPrivacy(e.target.value)}
                                                    className="peer sr-only"
                                                />
                                                <div
                                                    className={`mt-2 h-full rounded-lg border p-3 transition peer-checked:border-blue-500 peer-checked:ring-2 peer-checked:ring-blue-500/25 ${dark
                                                        ? "border-slate-600 hover:bg-[#35363a]"
                                                        : "border-slate-300 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                                        <Icon size={16} />
                                                        {label}
                                                    </div>
                                                    <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                                        {desc}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !workspaceName.trim()}
                                    className="mt-1 w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200"
                                >
                                    {isSubmitting ? "Creating..." : "Continue"}
                                </button>
                            </form>
                        </div>

                        {/* Illustration side */}
                        <div className="relative hidden min-w-0 overflow-hidden bg-[#e5f8fc] lg:flex lg:items-center lg:justify-center">

                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                fill="currentColor"
                                className={`absolute left-0 top-0 -ml-px h-full w-20 ${dark ? "text-[#2c2d31]" : "text-white"}`}
                            >
                                <path d="M0,0 H45 C10,25 40,50 55,75 C62,90 55,97 48,100 H0 Z" />
                            </svg>

                            <div className="relative w-64 rounded-md bg-linear-to-br from-cyan-500 to-green-300 p-3 shadow-xl">
                                <div className="mb-3 h-1.5 w-8 rounded bg-cyan-100/80" />
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3].map((column) => (
                                        <div key={column} className="space-y-2 rounded bg-gray-200/90 p-1.5">
                                            <div className="h-1.5 w-6 rounded bg-white" />
                                            <div className="h-9 rounded bg-white p-1.5">
                                                <div className="h-1.5 w-full rounded bg-slate-200" />
                                                <div className="mt-1.5 h-1.5 w-2/3 rounded bg-slate-200" />
                                            </div>
                                            <div className="h-6 rounded bg-white" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}

export default Sidebar;