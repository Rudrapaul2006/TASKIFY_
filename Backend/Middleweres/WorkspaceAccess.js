import { workspaceMemberShip } from "../Models/workspace.model.js"

// middleware/workspaceAccess.js
export let checkWorkspaceMember = async (req, res, next) => {
    try {
        let workspaceId = req.params.workspace_id   // apne route param ka naam use karo
        let userId = req.user._id

        let membership = await workspaceMemberShip.findOne({ workspace: workspaceId, user: userId })

        if (!membership) {
            return res.status(403).json({ success: false, message: "You are not a member of this workspace" })
        }

        req.membership = membership   // role controller me kaam aayega
        next()

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" })
    }
}

// owner-only actions ke liye
export let checkWorkspaceOwner = (req, res, next) => {
    if (req.membership?.role !== "workspace_owner") {
        return res.status(403).json({ success: false, message: "Only owner can do this" })
    }
    next()
}