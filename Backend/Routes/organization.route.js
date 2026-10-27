import express from 'express'
import { protection } from '../Authentication/Auth.js'
import { upload } from '../Utils/Multer.js'
import {
    create_organization, get_organization, get_organization_by_id, update_organization, update_organization_privacy,
    send_invitation_to_user, get_my_pending_invitations, get_owner_pending_invitations, user_accept_organization_invitation,
    user_decline_organization_invitation, approve_invitation_by_workspace_owner, reject_invitation_by_workspace_owner,
    cancel_invitation, resend_invitation
} from '../Controllers/organization.controller.js'

let OrganizationRouter = express.Router()

// Organization CRUD
OrganizationRouter.post('/create/:workspaceid', protection, upload.single('logo'), create_organization)
OrganizationRouter.get('/get_all_organization/:workspaceid', protection, get_organization)
OrganizationRouter.get('/get_organization_by_id/:workspaceid/:organizationid', protection, get_organization_by_id)
OrganizationRouter.patch('/update_organization/:workspaceid/:organizationid', protection, upload.single('logo'), update_organization)
OrganizationRouter.patch('/update_organization_privacy/:workspaceid/:organizationid', protection, update_organization_privacy)

// Organization invitations
OrganizationRouter.post('/send_invitation_to_user/:workspaceid/:organizationid', protection, send_invitation_to_user)
OrganizationRouter.get('/get_my_pending_invitations', protection, get_my_pending_invitations)
OrganizationRouter.get('/owner_pending_invitations/:organizationid', protection, get_owner_pending_invitations)
OrganizationRouter.post('/user_accept_invitation/:invitationid', protection, user_accept_organization_invitation)
OrganizationRouter.post('/user_decline_invitation/:invitationid', protection, user_decline_organization_invitation)
OrganizationRouter.patch('/approve_invitation/:workspaceid/:invitationid', protection, approve_invitation_by_workspace_owner)
OrganizationRouter.patch('/reject_invitation/:workspaceid/:invitationid', protection, reject_invitation_by_workspace_owner)
OrganizationRouter.patch('/cancel_invitation/:workspaceid/:organizationid/:invitationid', protection, cancel_invitation)
OrganizationRouter.patch('/resend_invitation/:workspaceid/:organizationid/:invitationid', protection, resend_invitation)

export default OrganizationRouter
