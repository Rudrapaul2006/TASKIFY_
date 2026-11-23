import { Dialog, DialogContent, DialogClose } from '@/Components/ui/dialog'
import { Plus, X, Upload, Globe, Lock, Loader2, Check } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { MdOutlineArrowDropDownCircle } from "react-icons/md"
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import toast from 'react-hot-toast'
import { add_organization, set_organization_loading, set_selected_org } from '@/Redux_Store/organizationSlice'

const Add_Organization = ({ isWorkspaceDropdownOpen }) => {
    let dispatch = useDispatch()

    let { theme } = useSelector(state => state.theme)
    let dark = theme === "dark"

    let { user } = useSelector(state => state.user)
    let { workspace, selected_workspace } = useSelector((state) => state.workspace)
    let { organization, selected_org } = useSelector(state => state.organization)

    let workspace_id = selected_workspace 
    let current_workspace = workspace?.find(ws => (ws?.workspace?._id || ws?._id) === workspace_id) || workspace?.[0]
    let isOwner = current_workspace?.role === "workspace_owner"



    // For organization drop down (support controlled or uncontrolled state)
    let [orgDropDown, setOrgDropDown] = useState(false)

    // For create organization dialog
    let [isDialogOpen, setIsDialogOpen] = useState(false)


    // current org 
    let current_org = organization?.find(org => org?._id === selected_org)
    let current_org_id = current_org?._id

    let resetForm = () => {
        if (searchTimer) clearTimeout(searchTimer)
        setName('')
        setDescription('')
        setAdmin('')
        setLogo(null)
        setMember([])
        setShowMemberDropdown(false)
        setSearchingMember(false)
    }


    // Create Organization

    // Form fields
    let [name, setName] = useState('')
    let [description, setDescription] = useState('')
    let [logo, setLogo] = useState(null)
    let [admin, setAdmin] = useState('')

    let [loading, setLoading] = useState(false)


    let handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)

            let formData = new FormData();

            formData.append("organization_name", name)
            formData.append("description", description)
            formData.append("teamLeaderEmail", admin)

            if (logo) {
                formData.append("logo", logo)
            }

            let res = await axios.post(`${import.meta.env.VITE_organization_endpoint}/create/${workspace_id}`, formData, { withCredentials: true })


            if (res.data.success) {
                toast.success(res.data.message)
                dispatch(add_organization(res.data.organization))

                // set the selected organization
                dispatch(set_selected_org(res.data.organization?._id))

                // close the dialog box
                setIsDialogOpen(false)

                // clear the form
                setName('')
                setDescription('')
                setAdmin('')
                setLogo(null)
                setShowMemberDropdown(false)
            }

        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || "something went wrong in create organization")
        } finally {
            setLoading(false)
        }
    }



    // search workspace member :
    let [member, setMember] = useState([])
    let [showMemberDropdown, setShowMemberDropdown] = useState(false)
    let [searchingMember, setSearchingMember] = useState(false)
    let [searchTimer, setSearchTimer] = useState(null)



    // Reset when dialog box is closed
    useEffect(() => {
        if (!isDialogOpen) {
            resetForm()
        }
    }, [isDialogOpen])


    // Search members only when user types in input
    let handleAdminSearch = (e) => {
        setAdmin(e.target.value)

        if (searchTimer) {
            clearTimeout(searchTimer)
        }

        let query = e.target.value.trim()
        let activeWsId = workspace_id

        if (!query || !activeWsId) {
            setMember([])
            setShowMemberDropdown(false)
            setSearchingMember(false)
            return
        }

        setShowMemberDropdown(true)
        setSearchingMember(true)

        let timer = setTimeout(async () => {
            try {

                let res = await axios.get(`${import.meta.env.VITE_organization_endpoint}/search_member/${workspace_id}?email=${encodeURIComponent(query)}`, { withCredentials: true })

                if (res.data?.success) {
                    setMember(res.data.members || [])
                    setShowMemberDropdown(true)
                } else {
                    setMember([])
                }
            } catch (error) {
                console.log(error)
                setMember([])
            } finally {
                setSearchingMember(false)
            }
        }, 200)

        setSearchTimer(timer)
    }

    // When user selects a member from dropdown
    let handleSelectMember = (u) => {
        if (searchTimer) {
            clearTimeout(searchTimer)
        }
        setAdmin(u?.email || '')
        setShowMemberDropdown(false)
        setMember([])
        setSearchingMember(false)
    }


    return (
        <>
            {orgDropDown && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOrgDropDown(false)}
                />
            )}

            <div className={`mt-5 relative ${isWorkspaceDropdownOpen ? "z-10 pointer-events-none" : "z-20"} pb-2.5 border-b ${dark ? "border-[#353537]" : "border-slate-200"}`}>
                <div
                    onClick={() => {
                        if (isWorkspaceDropdownOpen) return
                        setOrgDropDown(prev => !prev)
                    }}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-colors duration-200 ${isWorkspaceDropdownOpen ? "cursor-default" : "cursor-pointer"
                        } ${dark ? "text-slate-400 hover:bg-[#2A2A2D] hover:text-white" : "text-slate-500 hover:bg-gray-200 hover:text-slate-900"}
                    ${orgDropDown ? (dark ? "bg-[#2A2A2D] text-white" : "bg-gray-200 text-[#172554]") : ""}`}
                >
                    <span className={`text-sm font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        Organizations
                    </span>

                    <span className={`flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-300 ease-in-out ${orgDropDown ? "rotate-180" : "rotate-0"} ${dark ? "text-slate-400" : "text-slate-500"}`} >
                        <MdOutlineArrowDropDownCircle size={16} />
                    </span>
                </div>

                <div
                    className={`absolute left-0 right-0 top-full z-30 -mt-1.5 flex flex-col rounded-md border p-1 shadow-lg transition-all duration-200 ease-in-out origin-top ${orgDropDown ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none" } 
                    ${dark ? "border-[#353537] bg-[#252528] text-slate-100" : "border-slate-200 bg-white text-slate-800 shadow-sm"}`}
                >
                    {organization.length === 0 ? (
                        <div className={`text-xs flex items-center justify-center py-2.5 ${isOwner ? "border-b" : "border-none"} ${dark ? "border-[#39393a] text-slate-400" : "border-slate-200 text-slate-500"}`}>
                            No organizations found
                        </div>
                    ) : (
                        <div className={`max-h-52 overflow-y-auto space-y-0.5 ${isOwner ? "border-b pb-1 mb-1" : ""} ${dark ? "border-[#39393a]" : "border-slate-200"}`}>
                            {organization?.map(org => (
                                <div
                                    key={org?._id || org?.id || org?.name}
                                    onClick={() => {
                                        dispatch(set_selected_org(org?._id)) // selected org id will stored in localstorage
                                        dispatch(set_organization_loading(true))
                                        setTimeout(() => {dispatch(set_organization_loading(false))}, 500)

                                        setOrgDropDown(false)
                                    }}
                                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-all duration-200 ${dark ? "hover:bg-[#2a2a2d]" : "hover:bg-slate-100"} ${current_org_id === org?._id
                                        ? dark ? "bg-[#2a2a2d] text-white shadow-sm" : "bg-slate-100 text-slate-900 shadow-sm" : dark ? "text-slate-100" : "text-slate-800"} ${current_org_id === org?._id ? "font-semibold" : "font-medium"}`}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className='h-7 w-7 min-w-7 overflow-hidden rounded-full bg-green-500 flex items-center justify-center ring-1 ring-black/5'>
                                            {org.logo ? (
                                                <img src={org.logo} alt={org.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className='text-xs font-semibold text-black'>{org.name?.charAt(0)?.toUpperCase() || ""}</span>
                                            )}
                                        </div>

                                        <div className='truncate text-sm'>
                                            {org?.name}
                                        </div>
                                    </div>

                                    {current_org_id === org?._id && (
                                        <Check size={16} className="shrink-0 text-green-500" aria-label="Current organization" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {isOwner && (
                        <button
                            type="button"
                            onClick={() => {
                                setOrgDropDown(false)
                                setIsDialogOpen(true)
                            }}
                            className={`flex items-center gap-2 w-full px-2.5 py-2 mt-0.5 text-sm rounded-md cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-1 font-semibold 
                                ${dark ? "text-gray-300 hover:bg-[#2b2b2c] hover:text-white focus-visible:ring-slate-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300"}`}
                        >
                            <Plus size={16} />
                            Create organization
                        </button>
                    )}
                </div>
            </div>


            {/* Create Organization Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
            }}>
                <DialogContent
                    showCloseButton={false}
                    className={`z-1001 w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:w-[600px] sm:max-w-[620px] md:max-w-[640px] min-h-[520px] sm:min-h-[580px] md:min-h-[600px] max-h-[92dvh] overflow-y-auto flex flex-col justify-between rounded-xl sm:rounded-2xl border p-4 sm:p-6 md:p-8 shadow-2xl transition-all duration-200 
                        ${dark ? "border-[#2a2a2e] bg-[#18181b] text-neutral-100 shadow-black/70" : "border-slate-200 bg-white text-slate-900 shadow-slate-300/40"}`}
                >

                    <div className="relative pr-8">
                        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
                            Create organization
                        </h2>
                        <p className={`text-xs sm:text-sm mt-1 font-normal ${dark ? "text-neutral-400" : "text-slate-500"}`}>
                            Group people and projects inside your workspace
                        </p>

                        <DialogClose
                            aria-label="Close dialog"
                            onClick={resetForm}
                            className={`absolute top-0 right-0 flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${dark ? "text-neutral-400 hover:text-white hover:bg-neutral-800/80" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"}`}
                        >
                            <X size={18} strokeWidth={2.2} />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-1 flex flex-1 flex-col justify-between">
                        <div className="space-y-5">

                            {/* Organization Name */}
                            <div>
                                <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dark ? "text-neutral-200" : "text-slate-700"}`}>
                                    Organization name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="TaskiFy Studio"
                                    maxLength={50}
                                    className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring ${dark ? "bg-[#121214] border border-[#2a2a2e] text-neutral-100 placeholder-neutral-500"
                                        : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400"}`}
                                />
                            </div>

                            <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dark ? "text-neutral-200" : "text-slate-700"}`}>
                                Logo
                            </label>

                            <div
                                className={`flex items-center overflow-hidden rounded-lg border ${dark ? "border-neutral-700 bg-[#121214]" : "border-slate-300 bg-slate-50"}`}
                            >
                                <input
                                    id="org-logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLogo(e.target.files[0])}
                                    className="hidden"
                                />

                                <label
                                    htmlFor="org-logo"
                                    className={`inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${dark ? "text-neutral-200 hover:bg-neutral-800" : "text-slate-700 hover:bg-slate-100"}`}
                                >
                                    <Upload size={14} className="shrink-0" />
                                    <span>{logo ? "Change logo" : "Choose logo"}</span>
                                </label>

                                {/* divider */}
                                <div className={`h-6 w-px shrink-0 ${dark ? "bg-neutral-700" : "bg-slate-300"}`} />

                                <p className={`min-w-0 flex-1 truncate px-3 text-xs sm:text-sm ${dark ? "text-neutral-400" : "text-slate-500"}`}>
                                    {logo ? logo.name : "No file chosen"}
                                </p>
                            </div>

                            <div>
                                <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dark ? "text-neutral-200" : "text-slate-700"}`}>
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What does this organization work on?"
                                    maxLength={250}
                                    className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all resize-none min-h-[85px] focus:outline-none focus:ring-1 ${dark ? "bg-[#121214] border border-[#2a2a2e] text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:ring-neutral-500"
                                        : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"}`}
                                />
                            </div>

                            {/* Select admin div */}
                            <div className="relative">
                                <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dark ? "text-neutral-200" : "text-slate-700"}`}>
                                    Select admin
                                </label>

                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Search member by name or email..."
                                        value={admin}
                                        onChange={handleAdminSearch}
                                        maxLength={60}
                                        className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring ${admin ? "pr-9" : ""} ${dark ? "bg-[#121214] border border-[#2a2a2e] text-neutral-100 placeholder-neutral-500" : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400"}`}
                                    />
                                </div>

                                {/* Search member results under admin div */}
                                {showMemberDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setShowMemberDropdown(false)}
                                        />
                                        <div
                                            className={`mt-2 absolute left-0 right-0 top-full z-40 mt-1 max-h-48 overflow-y-auto rounded-lg border p-1 shadow-2xl transition-all [scrollbar-width:thin] 
                                            ${dark ? "border-[#2a2a2e] bg-[#1a1a1d] text-neutral-100 shadow-black/80" : "border-slate-200 bg-white text-slate-900 shadow-slate-300/60"}`}
                                        >
                                            {searchingMember ? (
                                                <div className="flex items-center justify-center gap-2 py-3 text-xs text-neutral-400">
                                                    <Loader2 size={13} className="animate-spin" />
                                                    <span>Searching members...</span>
                                                </div>
                                            ) : member && member?.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {member?.slice(0, 1).map((m) => {
                                                        let u = m?.user

                                                        return (
                                                            <div
                                                                key={m?._id || u?._id}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault()
                                                                    handleSelectMember(u)
                                                                }}
                                                                onClick={() => handleSelectMember(u)}
                                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-xs transition-colors ${(dark ? "hover:bg-[#252529] text-neutral-200" : "hover:bg-slate-100 text-slate-800")}`}
                                                            >
                                                                {/* User Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="block truncate font-medium text-xs">{u?.name || "Member"}</span>
                                                                    <span className={`block truncate text-[11px] ${dark ? "text-neutral-400" : "text-slate-500"}`}>
                                                                        {u?.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="py-2.5 text-center text-xs text-neutral-400">
                                                    No members found
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                        </div>

                        {/* Footer Actions */}
                        <div className={`mt-6 pt-4 border-t flex items-center justify-end gap-3 ${dark ? "border-neutral-800" : "border-slate-200"}`}>
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm()
                                    setIsDialogOpen(false)
                                }}
                                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all cursor-pointer  ${dark
                                    ? "border-neutral-700/80 bg-[#222226] hover:bg-[#2b2b30] text-neutral-200" : "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center gap-2 rounded-lg border px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm ${dark
                                    ? "border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed"
                                    : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:text-slate-100 disabled:cursor-not-allowed"}`}
                            >
                                {loading && <Loader2 size={14} className="animate-spin text-white" />}
                                <span>{loading ? "Creating..." : "Create"}</span>
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default Add_Organization
