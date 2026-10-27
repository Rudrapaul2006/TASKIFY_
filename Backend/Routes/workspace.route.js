import express from 'express'
import { protection } from '../Authentication/Auth.js'
import { upload } from "../Utils/Multer.js"
import {
    create_workspace, get_all_workspace, get_workspace_by_id, update_workspace,
    change_members_role, update_workspace_privacy, invite_user_in_workspace, get_all_sended_invitations,
    cancel_user_invitation, get_user_invitations, accept_workspace_invitation, decline_workspace_invitation,
    workspace_find_code, regenerate_workspace_findcode, find_workspace_by_findcode, send_join_request, get_sended_requests,
    cancel_join_request, get_your_pending_requests, owner_accept_join_request, owner_decline_join_request,
    get_all_workspace_members,
    remove_user_from_workspace,
    leave_workspace,
    invitation_activity_and_history
} from '../Controllers/workspace.controller.js'

// import { checkWorkspaceMember, checkWorkspaceOwner } from '../Middleweres/WorkspaceAccess.js' 



let WorkspaceRouter = express.Router()


// Protected routes :
WorkspaceRouter.post("/create", protection, upload.single("logo"), create_workspace)
WorkspaceRouter.get("/getall", protection, get_all_workspace)
WorkspaceRouter.get("/get/:workspaceid", protection, get_workspace_by_id)
WorkspaceRouter.put("/update/:workspaceid", protection, upload.single("logo"), update_workspace)
WorkspaceRouter.patch("/update_privacy/:workspaceid", protection, update_workspace_privacy)


// Change user role in workspace :
WorkspaceRouter.put("/update_role/:workspaceid/:userid", protection, change_members_role)


// Invitation in workspace api (owner sends invitation → user accepts/declines) :
WorkspaceRouter.post("/send_invitation/:workspaceid", protection, invite_user_in_workspace) //[owner]
WorkspaceRouter.get("/get_sended_invitations/:workspaceid", protection, get_all_sended_invitations) //[owner]
WorkspaceRouter.get("/history_and_invitation_activity/:workspaceid",protection, invitation_activity_and_history) //[owner] ['cancelled', 'expired', 'declined']
WorkspaceRouter.patch("/:workspaceid/cancel_invitation/:invitationid", protection, cancel_user_invitation) //[owner]
WorkspaceRouter.get("/getall_invitation", protection, get_user_invitations) //[user]
WorkspaceRouter.post("/accept_invitation/:invitationid", protection, accept_workspace_invitation) //[user]
WorkspaceRouter.post("/decline_invitation/:invitationid", protection, decline_workspace_invitation) //[user]


// Find code : owner can view & regenerate the workspace find code [owner only]
WorkspaceRouter.get("/find_code/:workspaceid", protection, workspace_find_code)
WorkspaceRouter.put("/regenerate_find_code/:workspaceid", protection, regenerate_workspace_findcode) //[o]


// User sends join request by workspace ID or find workspace by findCode → owner accepts/declines [user route]
WorkspaceRouter.post("/find_by_code", protection, find_workspace_by_findcode)
WorkspaceRouter.post("/send_join_request/:workspaceid", protection, send_join_request)
WorkspaceRouter.get("/sended_join_request", protection, get_sended_requests) //[user]
WorkspaceRouter.get("/workspace/sended_join_request", protection, get_sended_requests) //[user alias for backwards compatibility]
WorkspaceRouter.patch("/:workspaceid/cancel_join_request/:joinreqid", protection, cancel_join_request) //[user]
WorkspaceRouter.get("/get_pending_join_request/:workspaceid", protection, get_your_pending_requests) //[owner]
WorkspaceRouter.post("/accept_join_request/:joinreqid", protection, owner_accept_join_request)
WorkspaceRouter.post("/decline_join_request/:joinreqid", protection, owner_decline_join_request)

 
// General route's : 
WorkspaceRouter.get("/get_all_members/:workspaceid", protection, get_all_workspace_members)
WorkspaceRouter.patch("/leave/:workspaceid", protection, leave_workspace)
WorkspaceRouter.patch("/remove_member/:workspaceid/:userid", protection, remove_user_from_workspace)



export default WorkspaceRouter
