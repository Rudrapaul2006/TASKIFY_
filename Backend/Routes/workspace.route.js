import express from 'express'
import { protection } from '../Authentication/Auth.js'
import { upload } from "../Utils/Multer.js"
import { acceptInvitationOfWorkspace, acceptJoinRequst, cancelJoinRequest, cancelUserInvitation, changeRole, createWorkspace, declineInvitationOfWorkspace, declineJoinRequest, findWorkspaceByCode, getAllInvitationOfWorkspace,
    getAllSendedInvitations,
    getAllWorkspace, getPendingJoinRequests, getSendedJoinReq, getWorkspaceById, getWorkspaceFindCode, invitationInWorkspace, regenerateFindCode, sendJoinRequest, updateWorkspace, updateWorkspacePrivacy
} from '../Controllers/workspace.controller.js'

let WorkspaceRouter = express.Router()


// protected routes :
WorkspaceRouter.post("/create", protection, upload.single("logo"), createWorkspace)
WorkspaceRouter.get("/getall", protection, getAllWorkspace)
WorkspaceRouter.get("/get/:workspaceid", protection, getWorkspaceById)
WorkspaceRouter.put("/update/:workspaceid", protection, updateWorkspace)
WorkspaceRouter.patch("/update_privacy/:workspaceId", protection, updateWorkspacePrivacy)


//Change user role in workspace :
WorkspaceRouter.put("/update_role/:workspaceid/:userid", protection, changeRole)


// Invitation in workspace api (owner sends invitation → user accepts/declines) :
WorkspaceRouter.post("/send_invitation/:workspaceid", protection, invitationInWorkspace) //[owner]
WorkspaceRouter.get("/get_sended_invitations/:workspaceid", protection, getAllSendedInvitations) //[owner]
WorkspaceRouter.post("/cancel_invitation/:invitationid", protection, cancelUserInvitation) //[owner]
WorkspaceRouter.get("/getall_invitation", protection, getAllInvitationOfWorkspace) //[user]
WorkspaceRouter.post("/accept_invitation/:invitationid", protection, acceptInvitationOfWorkspace) //[user]
WorkspaceRouter.post("/decline_invitation/:invitationid", protection, declineInvitationOfWorkspace) //[user]


// Find code : owner can view & regenerate the workspace find code [owner only]
WorkspaceRouter.get("/find_code/:workspaceid", protection, getWorkspaceFindCode)
WorkspaceRouter.put("/regenerate_find_code/:workspaceid", protection, regenerateFindCode)


// User sends join request by workspace ID or find workspace by findCode → owner accepts/declines [user route]
WorkspaceRouter.post("/find_by_code", protection, findWorkspaceByCode)
WorkspaceRouter.post("/send_join_request/:workspaceid", protection, sendJoinRequest)
WorkspaceRouter.get("/workspace/sended_join_req", protection, getSendedJoinReq) //[user]
WorkspaceRouter.delete("/cancel_join_request/:joinreqid", protection, cancelJoinRequest)
WorkspaceRouter.get("/get_user_join_request/:workspaceid", protection, getPendingJoinRequests) //[owner]
WorkspaceRouter.post("/accept_join_request/:joinreqid", protection, acceptJoinRequst)
WorkspaceRouter.post("/decline_join_request/:joinreqid", protection, declineJoinRequest)


export default WorkspaceRouter
