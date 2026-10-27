import { ArrowDown, ArrowRight, Briefcase, Building2, KanbanSquare, UserPlus } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'

const No_workspace_home = () => {

    let { theme } = useSelector(state => state.theme)
    
    return (
        <div
            className={`flex h-full w-full items-start justify-center overflow-auto p-6 pt-2 sm:items-center sm:pt-6 ${theme === "dark" ? "bg-[#1a1a1c]" : "bg-gradient-to-br from-slate-50 via-white to-blue-50"}`}
        >
            <div className="flex flex-col items-center">
                <p
                    className={`mb-8 text-center text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                >
                    Set up your workspace in a few simple steps
                </p>

                <div className="lg:mt-0 flex flex-col items-center gap-2 lg:flex-row lg:gap-3">
                    {[
                        {
                            title: "Create workspace",
                            description: "Set up your team space",
                            Icon: Briefcase,
                            color: "from-blue-500 to-indigo-600",
                        },
                        {
                            title: "Invite users",
                            description: "Bring your team together",
                            Icon: UserPlus,
                            color: "from-purple-500 to-fuchsia-600",
                        },
                        {
                            title: "Create organization",
                            description: "Organize your teams",
                            Icon: Building2,
                            color: "from-amber-500 to-orange-600",
                        },
                        {
                            title: "Create boards",
                            description: "Manage projects easily",
                            Icon: KanbanSquare,
                            color: "from-emerald-500 to-green-600",
                        },
                    ].map(({ title, description, Icon, color }, index, arr) => (
                        <div
                            key={title}
                            className="flex flex-col items-center gap-3 lg:flex-row lg:gap-3"
                        >
                            <div
                                className={`group flex w-40  flex-col items-center rounded-2xl border p-5 text-center transition duration-300 hover:-translate-y-1 ${theme === "dark"
                                    ? "border-white/10 bg-[#242426] text-slate-100 hover:border-white/20 hover:bg-[#2a2a2d]"
                                    : "border-gray-200 bg-white text-slate-900 shadow-sm hover:shadow-md"}`}
                            >
                                <span
                                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg transition duration-300 group-hover:scale-110`}
                                >
                                    <Icon size={22} strokeWidth={2.2} />
                                </span>

                                <p className="text-sm font-semibold">{title}</p>

                                <p
                                    className={`mt-1 text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                                        }`}
                                >
                                    {description}
                                </p>
                            </div>

                            {index < arr.length - 1 && (
                                <>
                                    <ArrowDown
                                        size={20}
                                        className={theme === "dark" ? "text-slate-600 lg:hidden" : "text-slate-400 lg:hidden"}
                                    />
                                    <ArrowRight
                                        size={20}
                                        className={theme === "dark" ? "hidden text-slate-600 lg:block" : "hidden text-slate-400 lg:block"}
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default No_workspace_home
