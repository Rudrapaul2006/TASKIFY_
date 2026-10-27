import mongoose from "mongoose";
import { workspaceMemberShip } from "../Models/workspace.model.js";
import { organizationInvitation, organizationMembership, organizationModel } from "../Models/organization.model.js";
import { uploadImageOnCloudinary } from '../Utils/Cloudinary.js'
import userModel from "../Models/user.model.js";




let expire_stail_organization_invitations = async (organization_id, invited_email) => {
    if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) return
    if (typeof invited_email !== 'string' || !invited_email.trim()) return

    await organizationInvitation.updateMany({
        organization: organization_id,
        invitedEmail: invited_email.trim().toLowerCase(),
        status: { $in: ['pending_user_response', 'pending_workspace_approval'] },
        expiresAt: { $lte: new Date() }
    }, { status: 'expired' })
}




// create organization under a workspace : [POST] [workspace_owner]
// full route : ../api/organization/create/:workspaceid
// body => { organization_name, privacy, organizationLeader }
// optional file => logo
// Returns => organization
export let create_organization = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a authenticated user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id) || workspace_id === '') {
            return res.status(400).json({ message: "Please provide a workspace id", success: false })
        }

        let { organization_name, privacy, organizationLeaderEmail } = req.body

        if (typeof organization_name !== 'string' || !(organization_name = organization_name.trim())) {
            return res.status(400).json({ message: 'Please provide a valid organization name', success: false })
        }

        if (typeof privacy !== 'string' || !(privacy = privacy.trim())) {
            return res.status(400).json({ message: 'Please provide a valid privacy setting', success: false })
        }

        if (typeof organizationLeaderEmail !== 'string' || !(organizationLeaderEmail = organizationLeaderEmail.trim())) {
            return res.status(400).json({ message: 'Please provide a valid organization leader email', success: false })
        }

        organizationLeaderEmail = organizationLeaderEmail.toLowerCase().trim()

        let user_membership_in_workspace = await workspaceMemberShip.findOne({
            user: user?._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        }).lean()

        if (!user_membership_in_workspace) {
            return res.status(403).json({ message: 'You are not allowed to create organization in this workspace', success: false })
        }

        let org_leader = await userModel.findOne({ email: organizationLeaderEmail }).select('_id email').lean()
        if (!org_leader) {
            return res.status(404).json({ message: 'Organization leader not found', success: false })
        }

        let org_leader_membership = await workspaceMemberShip.findOne({
            user: org_leader?._id,
            workspace: workspace_id,
            role: { $in: ['workspace_owner', 'workspace_member'] }
        }).lean()

        if (!org_leader_membership) {
            return res.status(403).json({ message: 'Organization leader is not a member of this workspace', success: false })
        }

        let logo = ''
        if (req.file) {
            let upload_on_cloudinary = await uploadImageOnCloudinary(req.file.path)
            if (!upload_on_cloudinary) {
                return res.status(400).json({ message: 'Error in upload logo', success: false })
            }
            logo = upload_on_cloudinary
        }

        let organization = await organizationModel.create({
            name: organization_name,
            privacy,
            logo,
            workspace: workspace_id,
            organizationOwner: user?._id,
            organizationLeader: org_leader?._id
        })

        await organizationMembership.create({
            user: user?._id,
            workspace: workspace_id,
            organization: organization?._id,
            role: 'organization_owner'
        })

        if (org_leader?._id.toString() !== user?._id.toString()) {
            await organizationMembership.create({
                user: org_leader?._id,
                workspace: workspace_id,
                organization: organization?._id,
                role: 'organization_leader'
            })
        }

        return res.status(200).json({
            message: 'Organization created successfully',
            organization,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in create organization api",
            success: false
        })
    }
}


// Get organizations in workspace : [GET] [organization owner and user]
// Route: /api/organization/get_all_organization/:workspaceid
// Requires an authenticated workspace member
// Returns => organizations
export let get_organization = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a authenticated user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id) || workspace_id === '') {
            return res.status(400).json({ message: "Please provide a workspace id", success: false })
        }

        let user_membership_in_workspace = await workspaceMemberShip.findOne({ user: user?._id, workspace: workspace_id })
        if (!user_membership_in_workspace) {
            return res.status(400).json({ message: 'You are not a member of this workspace', success: false })
        }

        let user_organizations = await organizationModel.find({ workspace: workspace_id })
        if (user_organizations.length === 0) {
            return res.status(404).json({ message: 'No organizations found in this workspace', success: false })
        } 

        return res.status(200).json({
            message: 'Organizations retrieved successfully',
            organizations: user_organizations,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in get organization api",
            success: false
        })
    }
}


// Get an organization by id : [GET] [organization member / workspace member]
// Route: /api/organization/get_organization_by_id/:workspaceid/:organizationid
// Returns => organization
export let get_organization_by_id = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a authenticated user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id) || workspace_id === '') {
            return res.status(400).json({ message: "Please provide a workspace id", success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id) || organization_id === '') {
            return res.status(400).json({ message: "Please provide a organization id", success: false })
        }

        let user_membership_in_workspace = await workspaceMemberShip.findOne({ user: user?._id, workspace: workspace_id })
        if (!user_membership_in_workspace) {
            return res.status(400).json({ message: 'You are not a member of this workspace', success: false })
        }

        let organization = await organizationModel.findOne({ _id: organization_id, workspace: workspace_id }).populate('workspace', 'name logo').populate('organizationOwner', 'name email online')
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found in this workspace', success: false })
        }

        let user_membership_in_organization = await organizationMembership.findOne({ user: user?._id, organization: organization_id, workspace: workspace_id })
        if (!user_membership_in_organization) {
            return res.status(403).json({ message: 'You are not a member of this organization', success: false })
        }

        return res.status(200).json({
            organization,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in get organization by id api",
            success: false
        })
    }
}


// Update organization name and logo : [PATCH] [organization_owner]
// Route: /api/organization/update_organization/:workspaceid/:organizationid
// Body => { updated_name } (optional when uploading a logo)
// Optional file => logo
// Returns => organization
export let update_organization = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide an authenticated user", success: false })
        }

        let { updated_name } = req.body
        if (updated_name !== undefined && (typeof updated_name !== 'string' || updated_name.trim() === '')) {
            return res.status(400).json({ message: 'Please provide a valid organization name', success: false })
        }

        if (updated_name === undefined && !req.file) {
            return res.status(400).json({ message: 'Please provide a organization name or a new logo', success: false })
        }

        let logo = ''
        if (req.file) {
            let upload_on_cloudinary = await uploadImageOnCloudinary(req.file.path)
            if (!upload_on_cloudinary) {
                return res.status(400).json({ message: 'Error in upload image', success: false })
            }
            logo = upload_on_cloudinary
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id) || workspace_id === '') {
            return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id) || organization_id === '') {
            return res.status(400).json({ message: "Please provide a valid organization id", success: false })
        }


        let user_organization_membership = await organizationMembership.findOne({ user: user?._id, workspace: workspace_id, organization: organization_id, role: { $in: ['organization_owner'] } })
        if (!user_organization_membership) {
            return res.status(403).json({ message: 'You are not authorized to update this organization', success: false })
        }

        let update_organization = await organizationModel.findOne({ _id: organization_id, workspace: workspace_id })
        if (!update_organization) {
            return res.status(404).json({ message: 'Organization not found', success: false })
        }

        if (typeof updated_name === 'string' && updated_name.trim()) update_organization.name = updated_name.trim()
        if (logo) update_organization.logo = logo
        await update_organization.save()

        return res.status(200).json({
            message: 'Organization updated successfully',
            organization: update_organization,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in update organization api",
            success: false
        })
    }
}


// Update organization privacy : [PATCH] [organization_owner]
// Route: /api/organization/update_organization_privacy/:workspaceid/:organizationid
// Body => { privacy }
// File => logo
// Returns => organization
export let update_organization_privacy = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide an authenticated user", success: false })
        }

        let { privacy } = req.body
        if (typeof privacy !== 'string' || privacy.trim() === '' || !privacy) {
            return res.status(400).json({ message: 'Please provide a valid privacy value', success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id) || workspace_id === '') {
            return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id) || organization_id === '') {
            return res.status(400).json({ message: "Please provide an valid organization id", success: false })
        }

        let user_organization_membership = await organizationMembership.findOne({ user: user?._id, workspace: workspace_id, organization: organization_id, role: { $in: ['organization_owner'] } })
        if (!user_organization_membership) {
            return res.status(403).json({ message: 'You are not authorized to update this organization privacy', success: false })
        }

        let updated_organization = await organizationModel.findOneAndUpdate({ _id: organization_id, workspace: workspace_id }, { privacy }, { new: true })
        if (!updated_organization) {
            return res.status(404).json({ message: 'Organization not found in this workspace', success: false })
        }

        return res.status(200).json({
            message: 'Organization privacy updated successfully',
            organization: updated_organization,
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'server error in update organization privacy api',
            success: false
        })
    }
}


// Send organization invitation : [POST] [organization owner]
// Full route: /api/organization/send_invitation_to_user/:workspaceid/:organizationid
// Body => { invited_user_email }
// Returns => invitation
export let send_invitation_to_user = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(401).json({ message: 'Please provide an authenticated user', success: false })
        }

        let { invited_user_email } = req.body || {}
        if (typeof invited_user_email !== 'string' || !invited_user_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invited_user_email)) {
            return res.status(400).json({ message: 'Please provide invited user email', success: false })
        }
        invited_user_email = invited_user_email.trim().toLowerCase()

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Please provide a valid workspace id', success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Please provide a valid organization id', success: false })
        }

        let is_valid_organization = await organizationModel.findOne({ _id: organization_id, workspace: workspace_id })
        if (!is_valid_organization) {
            return res.status(404).json({ message: 'Organization not found in this workspace', success: false })
        }

        // only organization owner can send invitation 
        let user_organization_membership = await organizationMembership.findOne({
            user: user?._id,
            workspace: workspace_id,
            organization: organization_id,
            role: 'organization_owner'
        })
        if (!user_organization_membership) {
            return res.status(403).json({ message: 'You are not authorized to send invitation for this organization', success: false })
        }

        // is user exists on taskify or not 
        let existing_user = await userModel.findOne({ email: invited_user_email })
        if (!existing_user) {
            return res.status(404).json({ message: 'User not registered yet, please inform workspace owner to send workspace join invitation to user', success: false })
        }

        let is_user_already_in_organization = await organizationMembership.findOne({ user: existing_user?._id, workspace: workspace_id, organization: organization_id })
        if (is_user_already_in_organization) {
            return res.status(409).json({ message: 'User is already a member of this organization', success: false })
        }

        // mark stale open invitations as expired
        await expire_stail_organization_invitations(organization_id, invited_user_email)

        // find invited user's active invitation's
        let existing_invitation = await organizationInvitation.findOne({
            organization: organization_id,
            workspace: workspace_id,
            invitedEmail: invited_user_email,
            status: { $in: ['pending_user_response', 'pending_workspace_approval'] },
            expiresAt: { $gt: new Date() }
        })

        if (existing_invitation) {
            return res.status(409).json({ message: 'Active invitation is already sent to this user', success: false })
        }

        let invitation = await organizationInvitation.create({
            invitedBy: user?._id,
            invitedEmail: invited_user_email,
            organization: organization_id,
            workspace: workspace_id,
            role: 'organization_member',
            status: 'pending_user_response',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // expire in 7 days
        })

        return res.status(200).json({
            message: 'Invitation sent to user successfully',
            invitation,
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'server error in send invitation to user api',
            success: false
        })
    }
}


// Get sended invitations : [GET] [organization owner route]
// Full route => ..api/organization/get_sended_invitations/:workspaceid/:organizationid
// returning => invitations
export let get_sended_invitations = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(!user?._id)) {

        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Invalid organization id', success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Invalid workspace id', success: false })
        }

        // check if user is organization owner
        let user_membership_in_organization = await organizationMembership.findOne({
            workspace: workspace_id,
            organization: organization_id,
            user: user?._id,
            role: 'organization_owner'
        })
        if (!user_membership_in_organization) {
            return res.status(403).json({ message: 'You are not authorized to get sended invitations for this organization', success: false })
        }

        let invitations = await organizationInvitation.find({
            organization: organization_id,
            workspace: workspace_id,
            invitedBy: user?._id,
            status: { $in: ['pending', 'pending_user_response', 'pending_workspace_approval', 'workspace_rejected', 'accepted', 'declined', 'canceled', 'organization_canceled', 'expired'] }
        }).sort({ createdAt: -1 })

        return res.status(200).json({
            invitations,
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'server error in get sended invitations api',
            success: false
        })
    }
}

// organization owner cancel his invitation to user : [PATCH] [organization owner route]
// Route: ../api/organization/cancel_invitation/:workspaceid/:organizationid/:invitationid
export let cancel_invitation = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Provide a valid workspace id', success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Provide a valid organization id', success: false })
        }

        let invitation_id = req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: 'Invalid invitation ID', success: false })
        }

        let invitation = await organizationInvitation.findOne({
            _id: invitation_id,
            workspace: workspace_id,
            organization: organization_id,
            status: { $in: ['pending', 'pending_workspace_approval'] },
            expiresAt: { $gt: new Date() }
        }).populate('workspace', 'name logo').populate('organization', 'name logo').populate('invitedBy', 'name email online')
        if (!invitation) return res.status(404).json({ message: 'Invitation not found or invalid', success: false })

        let org_membership = await organizationMembership.findOne({ user: user?._id, workspace: invitation?.workspace, organization: invitation?.organization, role: 'organization_owner' })
        if (!org_membership) {
            return res.status(403).json({ message: 'Not authorized to cancel the invitation', success: false })
        }

        if (invitation?.status !== 'pending' || invitation?.status !== 'pending_workspace_approval') {
            return res.status(400).json({ message: 'Only pending invitations can be cancelled', success: false })
        }

        invitation.status = 'organization_canceled'
        await invitation.save()

        return res.status(200).json({ message: 'Invitation canceled by organization owner', success: true })
    } catch (error) {
        return res.status(500).json({ message: 'server error on organization cancel invitation api', success: false })
    }
}


// user get organization invitation : [GET] [user route] 
// Get pending organization invitations for the authenticated user
// Route: ../api/organization/my_pending_invitations
// Returns => invitations
export let get_my_pending_invitations = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(401).json({ message: 'Please provide an authenticated user', success: false })
        }

        // Find all pending invitations for this user's email that haven't expired
        let pending_invitations = await organizationInvitation.find({
            invitedEmail: user.email.toLowerCase(),
            status: 'pending_user_response',
            expiresAt: { $gt: new Date() }
        }).populate('workspace', 'name logo').populate('organization', 'name logo').populate('invitedBy', 'name email onine')

        return res.status(200).json({
            invitations: pending_invitations,
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'server error in get my pending invitations api',
            success: false
        })
    }
}


// user accept the organization invitation : [POST] [user route]
// Route: /api/organization/user_accept_invitation/:invitationid
export let user_accept_organization_invitation = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(401).json({ message: 'Please provide an authenticated user', success: false })
        }

        let invitation_id = req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: 'Invalid invitation details', success: false })
        }

        let invitation = await organizationInvitation.findOne({
            _id: invitation_id,
            workspace: req.params.workspaceid,
            invitedEmail: user.email.toLowerCase().trim(),
            status: 'pending_user_response',
            expiresAt: { $gt: new Date() }
        })
        if (!invitation) return res.status(404).json({ message: 'Invitation not found or invitation is expired', success: false })

        invitation.status = 'pending_workspace_approval'
        invitation.acceptedBy = user?._id
        await invitation.save()

        return res.status(200).json({ message: 'Invitation accepted, pending workspace approval', success: true })

    } catch (error) {
        return res.status(500).json({ message: 'server error in accept organization invitation api', success: false })
    }
}


// user decline the organization invitation : [POST] [user route]
// Route: ../api/organization/user_decline_invitation/:invitationid
export let user_decline_organization_invitation = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(401).json({ message: 'Please provide an authenticated user', success: false })
        }

        let invitation_id = req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: 'Invalid invitation ID', success: false })
        }

        let invitation = await organizationInvitation.findOne({
            _id: invitation_id,
            workspace: req.params.workspaceid,
            invitedEmail: user.email.toLowerCase().trim(),
            status: 'pending_user_response',
            expiresAt: { $gt: new Date() }
        })
        if (!invitation) return res.status(404).json({ message: 'Invitation not found or invitation is expired', success: false })

        invitation.status = 'declined'
        await invitation.save()

        return res.status(200).json({ message: 'Invitation declined', success: true })
    } catch (error) {
        return res.status(500).json({ message: 'server error', success: false })
    }
}


// workspace owner get the pending invitation in his organization (for workspace approval) : [GET] [workspace owner route]
// Route: ../api/organization/owner_pending_invitations/:organizationid
// Returns => invitations
export let get_owner_pending_invitations = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(401).json({ message: 'Please provide an authenticated user', success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Please provide a valid organization id', success: false })
        }

        let is_valid_organization = await organizationModel.findOne({
            _id: organization_id,
            organizationOwner: user?._id
        })
        if (!is_valid_organization) {
            return res.status(404).json({ message: 'Organization not found or you are not owner of this organization', success: false })
        }

        // Find all pending invitations for this organization that haven't expired
        let pending_invitations = await organizationInvitation.find({
            organization: organization_id,
            status: 'pending_workspace_approval',
            expiresAt: { $gt: new Date() }
        }).populate('workspace', 'name logo').populate('organization', 'name logo').populate('invitedBy', 'name email online')

        return res.status(200).json({
            invitations: pending_invitations,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'server error in get owner pending invitations api',
            success: false
        })
    }
}


// workspace owner accept user invitations for workspace approval : [GET] [workspace owner route]
// Route: ../api/organization/approve_invitation/:workspaceid/:invitationid
export let approve_invitation_by_workspace_owner = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Provide a valid user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Provide a valid workspace id', success: false })
        }

        let invitation_id = req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: 'Provide a valid invitation id', success: false })
        }

        let invitation = await organizationInvitation.findOne({
            _id: invitation_id,
            workspace: workspace_id,
            status: 'pending_workspace_approval',
            expiresAt: { $gt: new Date() }
        }).populate('organization', 'name')
        if (!invitation) return res.status(404).json({ message: 'Invitation not found', success: false })

        let workspace_membership = await workspaceMemberShip.findOne({ user: user?._id, workspace: workspace_id, role: 'workspace_owner' })
        if (!workspace_membership) {
            return res.status(403).json({ message: 'Not authorized to approve for this workspace', success: false })
        }

        // cheak user already member of this workspace or not : 
        let existing_workspace_membership = await workspaceMemberShip.findOne({ user: invitation?.acceptedBy, workspace: invitation?.workspace })

        // if user is not a workspace member then create a workspace membership :
        if (!existing_workspace_membership) {
            await workspaceMemberShip.create({ user: invitation?.acceptedBy, workspace: invitation?.workspace, role: 'workspace_member' })

            await organizationMembership.create({
                user: invitation?.acceptedBy,
                workspace: invitation?.workspace,
                organization: invitation?.organization,
                role: 'organization_member'
            })
        }

        await organizationMembership.create({
            user: invitation?.acceptedBy,
            workspace: invitation?.workspace,
            organization: invitation?.organization,
            role: 'organization_member'
        })

        invitation.status = 'accept'
        await invitation.save()

        return res.status(200).json({ message: 'Invitation approved and memberships created', success: true });
    } catch (error) {
        return res.status(500).json({ message: 'server error', success: false });
    }
}


// workspace owner reject user invitations for workspace : [GET] [workspace owner route]
// Route: ../api/organization/reject_invitation/:workspaceid/:invitationid
export let reject_invitation_by_workspace_owner = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Invalid workspace ID', success: false })
        }

        let invitation_id = req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: 'Invalid invitation ID', success: false })
        }

        let invitation = await organizationInvitation.findOne({
            _id: invitation_id,
            workspace: workspace_id,
            status: 'pending_workspace_approval',
            expiresAt: { $gt: new Date() }
        }).populate('workspace', 'name logo').populate('organization', 'name logo').populate('invitedBy', 'name email online')
        if (!invitation) return res.status(404).json({ message: 'Invitation not found or invitation is expired', success: false })

        let workspace_membership = await workspaceMemberShip.findOne({ user: user?._id, workspace: invitation.workspace, role: { $in: ['workspace_owner'] } })
        if (!workspace_membership) {
            return res.status(403).json({ message: 'Not authorized to reject for this workspace', success: false });
        }

        if (invitation?.status !== 'pending_workspace_approval') {
            return res.status(400).json({ message: 'Invitation not pending approval', success: false })
        }

        invitation.status = 'workspace_rejected'
        await invitation.save()

        return res.status(200).json({ message: 'Invitation rejected by workspace', success: true })

    } catch (error) {
        return res.status(500).json({ message: 'server error', success: false })
    }
}


// organization owner resend invitation to user : [PATCH] [organization owner route]
// Route: ../api/organization/resend_invitation/:workspaceid/:organizationid/:invitationid
export let resend_invitation = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let invitation_id = req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: 'Please provide a valid invitation id', success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Please provide a valid workspace id', success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Please provide a valid organization id', success: false })
        }

        let invitation = await organizationInvitation.findOne({
            _id: invitation_id,
            workspace: workspace_id,
            organization: organization_id,
            status: { $in: ['pending', 'pending_workspace_approval'] },
            expiresAt: { $gt: new Date() }
        }).populate('workspace', 'name logo').populate('organization', 'name logo').populate('invitedBy', 'name email online')
        if (!invitation) return res.status(404).json({ message: 'Invitation not found or invalid/expired', success: false })

        let org_membership = await organizationMembership.findOne({ user: user._id, workspace: invitation.workspace, organization: invitation.organization, role: 'organization_owner' })
        if (!org_membership) {
            return res.status(403).json({ message: 'Not authorized to resend the invitation', success: false })
        }

        if (invitation?.status === 'pending' || invitation?.status === 'pending_workspace_approval') {
            return res.status(400).json({ message: 'Only non pending invitations can be resend', success: false })
        }

        invitation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        invitation.status = 'pending'
        await invitation.save()

        return res.status(200).json({ message: 'Invitation resent successfully', success: true })
    } catch (error) {
        return res.status(500).json({ message: 'server error', success: false })
    }
}


// user leave organization : [PATCH] [user route]
// Route: ../api/organization/leave_organization/:workspaceid/:organizationid
// Requires an authenticated user
export let user_leave_organization = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Please provide a valid workspace id', success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Please provide a valid organization id', success: false })
        }

        let org_membership = await organizationMembership.findOne({ user: user._id, workspace: workspace_id, organization: organization_id, role: 'organization_member' })
        if (!org_membership) {
            return res.status(404).json({ message: 'Not found any organization membership', success: false })
        }

        if (org_membership.role === 'organization_owner') {
            return res.status(400).json({ message: 'Organization owner cannot leave the organization', success: false })
        }

        await organizationMembership.deleteOne({ user: user._id, workspace: workspace_id, organization: organization_id })

        return res.status(200).json({ message: 'User left organization successfully', success: true })
    } catch (error) {
        return res.status(500).json({ message: 'server error', success: false })
    }
}


// organization owner remove organization member : [PATCH] [organization owner route]
// Route: ../api/organization/remove_member/:workspaceid/:organizationid/:memberid
export let remove_user_from_organization = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Please provide a valid workspace id', success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Please provide a valid organization id', success: false })
        }

        let memberid = req.params.memberid
        if (!memberid || !mongoose.Types.ObjectId.isValid(memberid)) {
            return res.status(400).json({ message: 'Please provide a valid member id', success: false })
        }

        let org_membership = await organizationMembership.findOne({ user: user._id, workspace: workspace_id, organization: organization_id, role: 'organization_owner' })
        if (!org_membership) {
            return res.status(403).json({ message: 'Not authorized to remove user from organization', success: false })
        }

        if (memberid === user?._id) {
            return res.status(400).json({ message: 'You cannot remove yourself from the organization', success: false })
        }

        let member_membership = await organizationMembership.findOne({ user: memberid, workspace: workspace_id, organization: organization_id, role: 'organization_member' })
        if (!member_membership) {
            return res.status(404).json({ message: 'Not found any organization membership', success: false })
        }

        await organizationMembership.deleteOne({ user: memberid, workspace: workspace_id, organization: organization_id })

        return res.status(200).json({
            message: 'User removed from organization successfully',
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'server error in remove user from organization api', success: false })
    }
}



// general routes : [get]
// Route: ../api/organization/total_members/:workspaceid/:organizationid
export let total_org_members = async (req, res) => {
    try {
        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: 'Please provide a valid workspace id', success: false })
        }

        let organization_id = req.params.organizationid
        if (!organization_id || !mongoose.Types.ObjectId.isValid(organization_id)) {
            return res.status(400).json({ message: 'Please provide a valid organization id', success: false })
        }

        let totalMembers = await organizationMembership.find({
            workspace: workspace_id,
            organization: organization_id
        }).populate('user', 'name email online')

        return res.status(200).json({
            totalMembersCount: totalMembers.length,
            members: totalMembers,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'server error in total organization members api',
            success: false
        })
    }
}


