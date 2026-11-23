import React from 'react'
import { useSelector } from 'react-redux'

export const Activity_Action_Message = (item) => {
    let type = (item?.type || "").trim()
    let targetName = item?.targetUser?.name || item?.meta?.targetName
    let targetEmail = item?.targetUser?.email || item?.meta?.targetEmail
    
    let wsName = item?.workspace?.name || item?.meta?.workspaceName || item?.meta?.orgName || item?.workspaceName

    // let {theme} = useSelector(state => state.theme)

    let target = targetName || targetEmail ? (
        <>
            {targetName ? (
                <u className="underline underline-offset-2 font-medium text-slate-900 dark:text-white decoration-slate-600 dark:decoration-slate-400">
                    {targetName}
                </u>
            ) : null}
            
            {targetEmail ? (
                <> {targetName ? " " : ""}<u className="font-medium text-black dark:text-white decoration-slate-700 dark:decoration-slate-400">
                    ({targetEmail})
                </u></>
            ) : null}
        </>
    ) : null

    let bold = (text) => <strong className="font-semibold text-slate-100 dark:text-white">{text}</strong>

    // Task move pattern (e.g. moved API Rate Limiter from In Progress to Done on Backend Sprint)
    if (type.toLowerCase().includes("moved") || item?.meta?.taskName) {
        let taskName = item?.meta?.taskName || "API Rate Limiter"
        let fromStage = item?.meta?.fromStage || "In Progress"
        let toStage = item?.meta?.toStage || "Done"
        let boardName = item?.meta?.boardName || "Backend Sprint"

        return (
            <>
                moved <u className="underline underline-offset-2 font-medium text-slate-100 dark:text-white decoration-slate-400">{taskName}</u> from {fromStage} to {bold(toStage)} on{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1e2e2a] text-emerald-400 border border-emerald-500/20">
                    {boardName}
                </span>
            </>
        )
    }

    // Created board pattern (e.g. created board Q4 Roadmap)
    if (type.toLowerCase().includes("created board") || item?.meta?.boardCreated) {
        let boardName = item?.meta?.boardName || item?.meta?.name || "Q4 Roadmap"
        return <>created board {bold(boardName)}</>
    }

    // Org / Settings pattern (e.g. updated Org settings for Rudra_01_org3)
    if (type.toLowerCase().includes("org settings") || type.toLowerCase().includes("organization")) {
        return <>updated Org settings for {bold(wsName || "Rudra_01_org3")}</>
    }

    switch (type) {
        case "workspace details update":
            return <>updated workspace details {wsName ? <>for {bold(wsName)}</> : ""}</>

        case "update workspace privacy":
            return (
                <>
                    updated workspace visibility {item?.meta?.privacy ? <>to {bold(item.meta.privacy)}</> : ""}
                </>
            )

        case "Send Invitation":
            return (
                <>
                    invited {target || "a user"} as {bold("Member")} {wsName ? <>to {bold(wsName)}</> : ""}
                </>
            )

        case "Resend Invitation":
            return (
                <>
                    resent invitation to {target || "a user"} {wsName ? <>for {bold(wsName)}</> : ""}
                </>
            )

        case "Invitation Canceled":
            return (
                <>
                    cancelled invitation for {target || "a user"} {wsName ? <>on {bold(wsName)}</> : ""}
                </>
            )

        case "Accept Invitation":
            return (
                <>
                    accepted invitation and joined as {bold("Member")} {wsName ? <>to {bold(wsName)}</> : ""}
                </>
            )

        case "Decline Invitation":
            return <>declined invitation {wsName ? <>to {bold(wsName)}</> : ""}</>

        case "Send Join Request":
            return <>requested to join {wsName ? bold(wsName) : "workspace"}</>

        case "Accept Join Request":
            return (
                <> accepted join request from {target || "a user"} as {bold("Member")} </>
            )

        case "Decline Join Request":
            return <>declined join request from {target || "a user"}</>

        default:
            return target ? <>{type} {target}</> : type || "activity"
    }
}
