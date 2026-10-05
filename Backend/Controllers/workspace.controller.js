import mongoose, { mongo } from "mongoose";
import userModel from "../Models/user.model.js";
import { workspaceInvitation, workspaceJoinRequest, workspaceMemberShip, workspaceModel } from "../Models/workspace.model.js";
import { uploadImageOnCloudinary } from "../Utils/Cloudinary.js";
import crypto from 'crypto'


// let userKey = red

// Creating workspace : [post request]
// Full route : ../api/workspace/create
// {workspace_name} from body
// Returning => createdWorkspace
export let createWorkspace = async (req, res) => {
    try {
        let user = req.user
        if (!user) {
            return res.status(400).json({
                message: "Not a valid user",
                success: false
            })
        }

        let { workspace_name } = req.body
        workspace_name = workspace_name?.trim()

        if (!workspace_name || workspace_name === '' || typeof workspace_name !== 'string') {
            return res.status(400).json({ message: "Please provide a valid workspace name", success: false })
        }

        let existingWorkspace = await workspaceModel.exists({
            workspaceOwner: user?._id,
            name: workspace_name
        })

        if (existingWorkspace) {
            return res.status(400).json({
                "Message": "You already have a workspace with this name",
                success: false
            })
        }

        let logo = ""
        if (req.file) {
            logo = await uploadImageOnCloudinary(req.file.path)

            if (!logo) {
                return res.status(400).json({
                    message: "Image upload failed",
                    success: false
                })
            }
        }

        let workspace = await workspaceModel.create({
            workspaceOwner: user?._id,
            name: workspace_name,
            logo
        })

        let membershipOfWorkspace = await workspaceMemberShip.create({
            user: user?._id,
            role: 'workspace_owner',
            workspace: workspace?._id
        })

        let createdWorkspace = await membershipOfWorkspace.populate(["user", "workspace"])

        if (!workspace) {
            return res.status(400).json({ message: "Cant create a workspace", success: false })
        }

        return res.status(200).json({
            message: "Workspace created successfully",
            createdWorkspace,
            success: true
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "server error in create workspace api",
            success: false
        })
    }
}


// Get all workspace's : [get request]
// Full route : ../api/workspace/getall
// Returning => workspaces
export let getAllWorkspace = async (req, res) => {``
    try {
        let user = req.user
        if (!user || !user._id || !mongoose.Types.ObjectId.isValid(user._id)) {
            return res.status(400).json({
                message: "Please provide a valid authenticated user",
                success: false
            })
        }

        let workspaces = await workspaceMemberShip.find({ user: user?._id }).populate("workspace").lean()
        if (workspaces.length === 0) {
            return res.status(400).json({
                message: "Can not find workspace with this user",
                success: false
            })
        }

        return res.status(200).json({ workspaces, success: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "server error in get all workspace api",
            success: false
        })
    }
}


// Get workspace by id : [get request]
// Full route : ../api/workspace/get/:workspaceid
// Returning => workspace
export let getWorkspaceById = async (req, res) => {
    try {

        let user = req.user
        if (!user || !user._id || !mongoose.Types.ObjectId.isValid(user._id)) {
            return res.status(400).json({
                message: "Plesase provide a valid authenticated user",
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: "Plesase provide a valid workspace id",
                success: false
            })
        }

        let workspace = await workspaceMemberShip.find({ user: user?._id, workspace: workspace_id }).populate("user").populate("workspace")
            .populate({
                path: "workspace",
                populate: {
                    path: "workspaceOwner",
                }
            })

        if (!workspace) {
            return res.status(400).json({
                message: "Can not find any workspace with this id",
                success: false
            })
        }

        return res.status(200).json({
            workspace,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in get workspace by id api", success: false
        })
    }
}


// Update workspace : [put request]
// Full route : ../api/workspace/update/:workspaceid
// {updated_workspace_name} from body
// Returning => updatedWorkspace
export let updateWorkspace = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user._id || !mongoose.Types.ObjectId.isValid(user._id)) {
            return res.status(400).json({
                message: "Plesase provide a valid authenticated user",
                success: false
            })
        }

        let { updated_workspace_name } = req.body
        if (!updated_workspace_name || updated_workspace_name === '') {
            return res.status(400).json({
                message: "Plesase provide a valid name",
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: "This is not a valid workspace id",
                success: false
            })
        }

        let existingWorkspace = await workspaceModel.exists({
            workspaceOwner: user?._id,
            name: updated_workspace_name.trim()
        })

        if (existingWorkspace) {
            return res.status(400).json({
                message: "This workspace name already exists. Please choose a unique name",
                success: false
            })
        }

        let updatedWorkspace = await workspaceModel.findOne({ _id: workspace_id, workspaceOwner: user?._id })
        if (!updatedWorkspace) {
            return res.status(404).json({
                message: "Workspace not found or you do not have permission to update it",
                success: false
            })
        }

        updatedWorkspace.name = updated_workspace_name.trim()
        await updatedWorkspace.save()

        return res.status(200).json({
            message: "Workspace name updated successfully",
            updatedWorkspace,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in update workspace api", success: false
        })
    }
}


// Change user role in workspace : [put request] [admin route]
// Full route : ../api/workspace/update_role/:workplaceid/:userid
// {role} => from body
// Returning => updatedRole 
export let changeRole = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(400).json({
                message: "PLease provide a authenticated user",
                success: false
            })
        }

        // The route uses :workplaceid in some places and :workspaceid in others.
        let workspace_id = req.params.workspaceid
        let user_id = req.params.userid

        if (!workspace_id || !user_id || !mongoose.Types.ObjectId.isValid(workspace_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(404).json({
                message: "Please provide a valid workspace ID and user ID",
                success: false
            })
        }

        let { role } = req.body
        let allowedRoles = ['workspace_member', 'organization_creator']

        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: `Please provide a valid role. Allowed: ${allowedRoles.join(', ')}`,
                success: false
            })
        }

        let membershipOfOwner = await workspaceMemberShip.findOne({ user: owner?._id, workspace: workspace_id.toString() })
        if (membershipOfOwner?.role !== "workspace_owner") {
            return res.status(400).json({
                message: `Only workplace owner can change user role`,
                success: false
            })
        }

        let membershipOfUser = await workspaceMemberShip.findOne({ user: user_id, workspace: workspace_id.toString() })
        if (!membershipOfUser) {
            return res.status(404).json({
                message: "User is not a member of this workspace",
                success: false
            })
        }

        if (membershipOfUser?.role === role) {
            return res.status(400).json({
                message: `User is already ${membershipOfUser?.role} of this workspace`,
                success: false
            })
        }

        let updateUserRoleInWorkspace = await workspaceMemberShip.findOneAndUpdate({ user: user_id, workspace: workspace_id }, { role: role })
        if (!updateUserRoleInWorkspace) {
            return res.status(400).json({
                message: "Unable to update the user's role in this workspace",
                success: false
            })
        }

        return res.status(200).json({
            message: "Role updated successfully",
            updatedRole: updateUserRoleInWorkspace,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in change user role in workspace api",
            success: false
        })
    }
}


// Update workspace privacy : [patch request] [owner only]
// Full route : ../api/workspace/update_privacy/:workspaceId
// Body: { privacy: 'public' | 'private' }
// Returning => updatedWorkspace
export let updateWorkspacePrivacy = async (req, res) => {
    try {
        let user = req.user
        if (!user) {
            return res.status(400).json({
                message: "Please provide a valid authenticated user",
                success: false
            })
        }

        let workspace_id = req.params.workspaceId
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: "Please provide a valid workspace id",
                success: false
            })
        }

        let { privacy } = req.body
        if (!privacy || !['public', 'private'].includes(privacy)) {
            return res.status(400).json({
                message: "Invalid privacy value. Allowed values: 'public', 'private'",
                success: false
            })
        }

        // Only the workspace owner can change privacy
        let ownerMembership = await workspaceMemberShip.findOne({
            user: user?._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })

        if (!ownerMembership) {
            return res.status(403).json({
                message: "Only the workspace owner can update the privacy setting",
                success: false
            })
        }

        let updatedWorkspace = await workspaceModel.findByIdAndUpdate(
            workspace_id, { privacy }, { new: true }
        ).select('name privacy')

        if (!updatedWorkspace) {
            return res.status(404).json({
                message: "Workspace not found",
                success: false
            })
        }

        return res.status(200).json({
            message: `Workspace privacy updated to '${privacy}' successfully`,
            success: true,
            updatedWorkspace
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "server error in update workspace privacy api",
            success: false
        })
    }
}




// Admin -> user invitation 

// Invite a user in workspace : [post request] [admin route]
// Full route : ../api/workspace/send_invitation/:workspaceid
// Invited user email => {email} from body
// Returning => invitation
export let invitationInWorkspace = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner._id || !mongoose.Types.ObjectId.isValid(owner._id)) {
            return res.status(400).json({
                message: "Please provide a valid authenticated workspace owner",
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: "Please provide a valid workspace Id",
                success: false
            })
        }

        let adminsMembershipInWorkspace = await workspaceMemberShip.findOne({ workspace: workspace_id, user: owner?._id, role: { $in: ["workspace_owner"] } })
        if (!adminsMembershipInWorkspace) {
            return res.status(400).json({
                message: "Only workspace owner can invited a user",
                success: false
            })
        }


        // user invitation :
        let { email } = req.body
        if (!email || !email.trim()) {
            return res.status(400).json({
                message: "Please provide a valid user email",
                success: false
            })
        }
        email = email.trim()

        let invitedUser = await userModel.findOne({ email: email })

        if (invitedUser) {
            let isAlreadyWorkspaceMember = await workspaceMemberShip.findOne({
                workspace: workspace_id,
                user: invitedUser._id,
            })

            if (isAlreadyWorkspaceMember) {
                return res.status(400).json({
                    message: "User is already workspace member",
                    success: false
                })
            }
        }

        let pendingInvitation = await workspaceInvitation.findOne({
            workspace: workspace_id,
            invitedEmail: email,
            status: "pending",
        })

        if (pendingInvitation) {
            return res.status(409).json({
                message: "Workspace invitation is already pending",
                success: false
            })
        }

        let createInvitation = await workspaceInvitation.create({
            invitedEmail: email,
            invitedBy: owner?._id,
            invitedFrom: adminsMembershipInWorkspace.role,

            workspace: workspace_id,
            status: "pending"
        })

        return res.status(200).json({
            message: "Invitation sent to user successfully",
            invitation: createInvitation,
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in workspace inviattion api",
            success: false
        })
    }
}


// Owner can get all sended req [for each workspace] [get request] [admin route]
// Full route => ../api/workspace/get_sended_invitations/:workspaceid
// Returning => getSendedInvitations
export let getAllSendedInvitations = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner._id)) {
            return res.status(400).json({
                message: "Please provide a valid user",
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || workspace_id === '' || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: "Please provide a valid workspace id",
                success: false
            })
        }

        let isWorkspaceOwner = await workspaceMemberShip.findOne({
            user: owner._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })

        if (!isWorkspaceOwner) {
            return res.status(403).json({
                message: "You are not the workspace owner",
                success: false
            })
        }

        // A workspace owner can have multiple invitation records, so returning an array
        let getSendedInvitations = await workspaceInvitation.find({
            invitedBy: owner?._id,
            workspace: workspace_id
        }).sort({ createdAt: -1 }).populate("workspace")

        if (!getSendedInvitations || getSendedInvitations.length === 0) {
            return res.status(404).json({
                message: "No invitations sent yet",
                success: false
            })
        }

        return res.status(200).json({
            success: true,
            getSendedInvitations
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in get all user invitation api",
            success: false
        })
    }
}




// Cancel the invitation : [delete request] [admin route] 
// Full route => ../api/workspace/cancel_invitation/:invitationid
// Returning => cancelInvitation
export let cancelUserInvitation = async (req, res) => {
        try {
            let owner = req.user
            if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
                return res.status(400).json({
                    message: "please provide a valid user",
                    success: false
                })
            }

            let invitation_id = req.params.invitationid
            if (!invitation_id || invitation_id === '' || !mongoose.Types.ObjectId.isValid(invitation_id)) {
                return res.status(400).json({
                    message: "Please provide a valid invitation id",
                    success: false
                })
            }

            let invitation = await workspaceInvitation.findOne({ _id: invitation_id })
            if (!invitation) {
                return res.status(400).json({
                    message: "Cant find invitation",
                    success: false
                })
            }

            let ownerMembership = await workspaceMemberShip.findOne({
                user: owner?._id,
                workspace: invitation?.workspace,
                role: 'workspace_owner'
            })

            if (!ownerMembership) {
                return res.status(400).json({
                    message: "You are not workspace owner",
                    success: false
                })
            }

            if (invitation.status !== 'pending') {
                return res.status(400).json({
                    message: "Invitation status is no longer pending",
                    success: false
                })
            }

            let cancelInvitation = await workspaceInvitation.findOneAndDelete({ _id: invitation_id })

            return res.status(200).json({
                message: "Invitation cancelled successfully",
                success: true,
                cancelInvitation
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "server error in delete user invitation api",
                success: false
            })
        }
    }


    // Invited user can get all the invitation (pending invitation's) for workspace : [get request] [user route]
    // Full route : ../api/workspace/getall_invitation
    // Returning => getInvitations
    export let getAllInvitationOfWorkspace = async (req, res) => {
        try {
            let user = req.user
            if (!user || !user.email) {
                return res.status(400).json({
                    message: "Please provide a valid authenticated user",
                    success: false
                })
            }

            let getInvitations = await workspaceInvitation.find({ invitedEmail: user.email, status: { $in: ["pending"] } }).populate('workspace').populate('invitedBy', 'name email avatar')
            if (getInvitations.length === 0) {
                return res.status(404).json({
                    message: "No workspace invitations found",
                    success: false
                })
            }

            return res.status(200).json({
                getInvitations,
                success: true
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "server error in get all workspace invitation api",
                success: false
            })
        }
    }


    // Invited user can accept the invitation for workspace : [post request] [user route]
    // Full route : ../api/workspace/accept_invitation/:invitationid
    // Returning => acceptInvitation
    export let acceptInvitationOfWorkspace = async (req, res) => {
        try {
            let userId = req.id
            let user = req.user
            if (!userId || !user?.email) {
                return res.status(400).json({
                    message: "Please provide a valid authenticated user",
                    success: false
                })
            }

            let invitation_id = req.params.invitationid
            if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
                return res.status(400).json({
                    message: "Please provide a valid invitation id",
                    success: false
                })
            }

            let invitation = await workspaceInvitation.findOne({
                _id: invitation_id,
                invitedEmail: user.email.trim()
            })

            if (!invitation) {
                return res.status(404).json({
                    message: "Valid invitation not found",
                    success: false
                })
            }

            if (invitation.status === 'accepted') {
                return res.status(400).json({
                    message: "You already accepted the invitation",
                    success: false
                })
            }

            if (invitation.status === 'decline') {
                return res.status(400).json({
                    message: "You already declined the invitation now you cant accept it",
                    success: false
                })
            }

            let workspaceId = invitation?.workspace

            let hasWorkspaceMembership = await workspaceMemberShip.findOne({ user: userId, workspace: workspaceId })
            if (hasWorkspaceMembership) {
                return res.status(400).json({
                    message: "You are already a member of this workspace",
                    success: false
                })
            }

            let createMembershipInWorkspace = await workspaceMemberShip.create({
                user: userId,
                role: 'workspace_member',
                workspace: workspaceId
            })

            if (!createMembershipInWorkspace) {
                return res.status(400).json({
                    message: "Problem to get membership in this workspace",
                    success: false
                })
            }

            let acceptInvitation = await workspaceInvitation.findOneAndUpdate(
                { _id: invitation_id, invitedEmail: user.email.trim() },
                { status: 'accepted' },
                { new: true }
            )

            return res.status(200).json({
                message: "Successfully accepted invitation of this workspace",
                acceptInvitation,
                success: true
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "server error in workspace invitation accept api",
                success: false
            })
        }
    }


    // Invited user can decline the invitation for workspace : [post request] [user route]
    // Full route : ../api/workspace/decline_invitation/:invitationid
    // Returning => declineInvitation
    export let declineInvitationOfWorkspace = async (req, res) => {
        try {
            let userId = req.id
            let user = req.user
            if (!userId || !user?.email) {
                return res.status(400).json({
                    message: "Please provide a valid authenticated user",
                    success: false
                })
            }

            let invitation_id = req.params.invitationid
            if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
                return res.status(400).json({
                    message: "Please provide a valid workspace id",
                    success: false
                })
            }

            let existingInvitation = await workspaceInvitation.findOne({
                _id: invitation_id,
                invitedEmail: user?.email.trim()
            })

            if (!existingInvitation) {
                return res.status(404).json({ message: "Workspace invitation not found", success: false })
            }

            if (existingInvitation.status === 'accepted') {
                return res.status(400).json({ message: "You already accepted the invitation, now you can't decline it", success: false })
            }

            if (existingInvitation.status === 'decline') {
                return res.status(400).json({ message: "You already declined the invitation", success: false })
            }

            let declineInvitation = await workspaceInvitation.findOneAndUpdate(
                { _id: invitation_id, invitedEmail: user?.email.trim() },
                { status: 'decline' },
                { new: true }
            )

            return res.status(200).json({
                message: "Successfully decline invitation of this workspace",
                declineInvitation,
                success: true
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "server error in decline invitation of workspace api",
                success: false
            })
        }
    }




    // Workspace owner gets the workspace find code [get request] [owner only]
    // Full route : ../api/workspace/find_code/:workspaceid
    // Returning => findCode , workspaceName
    export let getWorkspaceFindCode = async (req, res) => {
        try {
            let owner = req.user
            if (!owner) {
                return res.status(400).json({ message: "Please provide an authenticated user", success: false })
            }

            let workspace_id = req.params.workspaceid
            if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
                return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
            }

            // Only workspace_owner can view the join code
            let ownerMembership = await workspaceMemberShip.findOne({
                user: owner?._id,
                workspace: workspace_id,
                role: 'workspace_owner'
            })

            if (!ownerMembership) {
                return res.status(403).json({
                    message: "Only the workspace owner can access the join code",
                    success: false
                })
            }

            let workspace = await workspaceModel.findById(workspace_id).select('name findCode')
            if (!workspace) {
                return res.status(404).json({ message: "Workspace not found", success: false })
            }

            return res.status(200).json({
                message: "Workspace join code retrieved successfully",
                success: true,
                findCode: workspace.findCode,
                workspaceName: workspace.name
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "server error in get workspace join code api", success: false })
        }
    }


    // Workspace owner can regenerate a new find code [put request] [owner only]
    // Full route : ../api/workspace/regenerate_find_code/:workspaceid
    // Returning => newFindCode , workspaceName
    export let regenerateFindCode = async (req, res) => {
        try {
            let owner = req.user
            if (!owner) {
                return res.status(400).json({ message: "Please provide an authenticated user", success: false })
            }

            let workspace_id = req.params.workspaceid
            if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
                return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
            }

            // Only workspace_owner can regenerate
            let ownerMembership = await workspaceMemberShip.findOne({
                user: owner?._id,
                workspace: workspace_id,
                role: 'workspace_owner'
            })

            if (!ownerMembership) {
                return res.status(403).json({
                    message: "Only the workspace owner can regenerate the join code",
                    success: false
                })
            }

            let newFindCode = crypto.randomBytes(5).toString('hex').toUpperCase()

            let workspace = await workspaceModel.findByIdAndUpdate(
                workspace_id,
                { findCode: newFindCode },
                { new: true }
            ).select('name findCode')

            return res.status(200).json({
                message: "Join code regenerated successfully",
                success: true,
                newFindCode: workspace.findCode,
                workspaceName: workspace.name
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "server error in regenerate join code api", success: false })
        }
    }




    // User -> Admin joining request 

    // Find a workspace using its find code [post request] [user route]
    // Full route : ../api/workspace/find_by_code
    // Body: { findCode }
    // Returning => workspace
    export let findWorkspaceByCode = async (req, res) => {
        try {
            let { findCode } = req.body
            if (typeof findCode !== 'string' || !findCode.trim() || findCode === '') {
                return res.status(400).json({ message: "Please provide a valid find code", success: false })
            }

            let workspace = await workspaceModel.findOne({ findCode: findCode.trim().toUpperCase() })
            if (!workspace) {
                return res.status(404).json({ message: "No workspace found with this join code", success: false })
            }

            return res.status(200).json({
                message: "Workspace found successfully",
                success: true,
                workspace: {
                    _id: workspace._id,
                    name: workspace.name,
                    logo: workspace.logo
                }
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "server error while finding workspace by code", success: false })
        }
    }

    // User can send join request to workspace [post request] [user route]
    // Full route : ../api/workspace/send_join_request/:workspaceid
    // Returning => createJoinRequest
    export let sendJoinRequest = async (req, res) => {
        try {
            let user = req.user
            if (!user) {
                return res.status(400).json({
                    message: "Please provide a authenticated user",
                    success: false
                })
            }

            let workspace_id = req.params.workspaceid
            if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
                return res.status(400).json({
                    message: "Please provide a valid workspace id",
                    success: false
                })
            }

            let workspace = await workspaceModel.findById(workspace_id)
            if (!workspace) {
                return res.status(404).json({
                    message: "Workspace not found",
                    success: false
                })
            }

            if (workspace.workspaceOwner.toString() === user._id.toString()) {
                return res.status(400).json({
                    message: "You are the owner of this workspace and cannot send a join request",
                    success: false
                })
            }

            // Privacy check: Users can not send join requests to private workspaces
            if (workspace.privacy === 'private') {
                return res.status(403).json({
                    message: "This workspace is private. Join requests are not allowed.",
                    success: false
                })
            }

            let memberShip = await workspaceMemberShip.findOne({ user: user?._id, workspace: workspace?._id })
            if (memberShip) {
                return res.status(400).json({
                    message: "You are already a member of this workspace",
                    success: false
                })
            }

            let findPendingReq = await workspaceJoinRequest.findOne({ user: user?._id, workspace: workspace?._id, status: 'pending' })
            if (findPendingReq) {
                return res.status(400).json({
                    message: "You already send join request to this workspace",
                    success: false
                })
            }

            let createJoinRequest = await workspaceJoinRequest.create({
                user: user?._id,
                workspace: workspace?._id,
                status: 'pending'
            })

            if (!createJoinRequest) {
                return res.status(400).json({
                    message: "Failed to send join request. Please try again.",
                    success: false
                })
            }

            return res.status(201).json({
                message: "Join request sent successfully",
                success: true,
                createJoinRequest
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "server error in workspace join api",
                success: false
            })
        }
    }


    // User can get his all sending req for workspace
    // Full route : GET ../api/workspace/sended_join_req
    // Returning => allSentReuests
    export let getSendedJoinReq = async (req, res) => {
        try {
            let user = req.user
            if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
                return res.status(400).json({
                    message: "Please provide a valid user",
                    success: false
                })
            }

            let allSentRequests = await workspaceJoinRequest.find({ user: user?._id }).populate("workspace")
            if (allSentRequests.length === 0) {
                return res.status(404).json({
                    message: "No sent join requests found",
                    success: false
                })
            }

            return res.status(200).json({
                success: true,
                allSentRequests
            })

        } catch (error) {
            return res.status(500).json({
                message: "server error in get sended join request api",
                success: false
            })
        }
    }


    // User can cancel join request : [delete request] [user route] 
    // Full route : ../api/workspace/cancel_join_request/:joinreqid
    // Returning => cancelledRequest
    export let cancelJoinRequest = async (req, res) => {
        try {
            let user = req.user
            if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
                return res.status(400).json({
                    message: "Please provide a valid user",
                    success: false
                })
            }

            let joinreq_id = req.params.joinreqid
            if (!joinreq_id || !mongoose.Types.ObjectId.isValid(joinreq_id)) {
                return res.status(400).json({
                    message: "Please provide a valid join request id",
                    success: false
                })
            }

            let joinRequest = await workspaceJoinRequest.findOne({
                _id: joinreq_id,
                user: user?._id
            })

            if (!joinRequest) {
                return res.status(404).json({
                    message: "Join request not found",
                    success: false
                })
            }

            if (joinRequest.status !== 'pending') {
                return res.status(409).json({
                    message: "This join request is no longer pending",
                    success: false
                })
            }

            let cancelledRequest = await workspaceJoinRequest.findByIdAndDelete(joinreq_id)

            return res.status(200).json({
                message: "Join request cancelled successfully",
                success: true,
                cancelledRequest
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message: "Server error while cancelling join request",
                success: false
            })
        }
    }


    // Workspace owner gets join req of user [get request] [admin route]
    // Full route : ../api/workspace/joining_requests/:workspaceid
    // Returning => pendingRequests
    export let getPendingJoinRequests = async (req, res) => {
        try {
            let owner = req.user
            let workspace_id = req.params.workspaceid

            if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
                return res.status(400).json({ message: "Please provide a valid user", success: false })
            }

            if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
                return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
            }

            let ownerMembership = await workspaceMemberShip.findOne({
                user: owner?._id,
                workspace: workspace_id,
                role: 'workspace_owner'
            })

            if (!ownerMembership) {
                return res.status(403).json({ message: 'You are not workspace owner', success: false })
            }

            let pendingRequests = await workspaceJoinRequest.find({
                workspace: workspace_id,
                status: 'pending'
            }).populate('user', 'name email socketId online')

            return res.status(200).json({
                message: 'Pending join requests retrieved successfully',
                success: true,
                pendingRequests
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message: 'Server error retrieving workspace join requests',
                success: false
            })
        }
    }


    // admin can accept user joining req for workspace [post request] [admin route]
    // Full route : ../api/workspace/accept_joiningreq/:joinreqid
    // Returning => createUserMemberShip, pendingReq
    export let acceptJoinRequst = async (req, res) => {
        try {
            let owner = req.user
            if (!owner || !mongoose.Types.ObjectId.isValid(owner._id)) {
                return res.status(400).json({
                    message: "Please provide a valid user",
                    success: false
                })
            }

            let joinreq_id = req.params.joinreqid
            if (!joinreq_id || !mongoose.Types.ObjectId.isValid(joinreq_id)) {
                return res.status(400).json({
                    message: "Please provide a valid join request id",
                    success: false
                })
            }

            let joiningRequest = await workspaceJoinRequest.findOne({ _id: joinreq_id })
            if (!joiningRequest) {
                return res.status(404).json({
                    message: "Joining request not found",
                    success: false
                })
            }

            let user_id = joiningRequest.user
            let workspace_id = joiningRequest.workspace

            let memberShipOfOwner = await workspaceMemberShip.findOne({ user: owner._id, workspace: workspace_id, role: 'workspace_owner' })
            if (!memberShipOfOwner) {
                return res.status(400).json({
                    message: 'You are not workspace admin',
                    success: false
                })
            }

            if (joiningRequest?.status === 'accepted') {
                return res.status(409).json({
                    message: "You have already accepted this joining request",
                    success: false
                })
            }

            if (joiningRequest?.status !== 'pending') {
                return res.status(409).json({
                    message: "This joining request is no longer pending",
                    success: false
                })
            }

            // Check the requester did not become a member already
            let existingMembership = await workspaceMemberShip.findOne({
                user: joiningRequest.user,
                workspace: workspace_id
            })

            if (existingMembership) {
                return res.status(409).json({
                    message: "User is already member of this workspace",
                    success: false
                })
            }

            joiningRequest.status = 'accepted'
            joiningRequest.respondedBy = owner?._id
            await joiningRequest.save()

            let createUserMemberShip = await workspaceMemberShip.create({
                user: user_id,
                workspace: workspace_id,
                role: 'workspace_member'
            })

            return res.status(201).json({
                message: "Successfully accepted user joining request",
                success: true,
                createUserMemberShip,
                pendingReq: joiningRequest
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "server error in accept user joining request for workspace api",
                success: false
            })
        }
    }


    // admin can decline user joining req for workspace [post request] [admin route]
    // Full route : ../api/workspace/decline_joiningreq/:joinreqid
    // Returning => pendingReq
    export let declineJoinRequest = async (req, res) => {
        try {
            let owner = req.user
            if (!owner || !mongoose.Types.ObjectId.isValid(owner?._id)) {
                return res.status(400).json({
                    message: 'Please provide a authorize user',
                    success: false
                })
            }

            let joinReq_id = req.params.joinreqid
            if (!joinReq_id || !mongoose.Types.ObjectId.isValid(joinReq_id)) {
                return res.status(400).json({
                    message: 'Please provide a valid joining request id',
                    success: false
                })
            }

            let joiningRequest = await workspaceJoinRequest.findOne({ _id: joinReq_id })
            if (!joiningRequest) {
                return res.status(404).json({
                    message: "Joining request not found",
                    success: false
                })
            }

            let user_id = joiningRequest.user
            let workspace_id = joiningRequest.workspace

            let memberShipOfOwner = await workspaceMemberShip.findOne({ user: owner._id, workspace: workspace_id, role: 'workspace_owner' })
            if (!memberShipOfOwner) {
                return res.status(400).json({
                    message: 'You are not workspace admin',
                    success: false
                })
            }

            // An accepted or declined request cannot be handled again
            if (joiningRequest?.status === 'accepted') {
                return res.status(400).json({
                    message: "This joining request has already been accepted you cant decline it now",
                    success: false
                })
            }

            if (joiningRequest?.status === 'decline') {
                return res.status(400).json({
                    message: "This joining request has already been declined",
                    success: false
                })
            }

            // Check the requester did not become a member already
            let existingMembership = await workspaceMemberShip.findOne({
                user: user_id,
                workspace: workspace_id
            })

            if (existingMembership) {
                return res.status(409).json({
                    message: "User is already a workspace member",
                    success: false,
                })
            }

            joiningRequest.status = 'decline'
            joiningRequest.respondedBy = owner?._id
            await joiningRequest.save()

            return res.status(200).json({
                message: "Successfully decline user joining request",
                success: true,
                pendingReq: joiningRequest
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "server error in decline user joining request for workspace api",
                success: false
            })
        }
    }




// General Routes :

// Delete workspace
// DELETE /workspaces/:workspaceId/members/:userId — remove member from workspace (if he is not the owner and if he is not a member of organization in which the workspace is present)
// POST /workspaces/:workspaceId/leave — member leaves workspace (if he is not the owner and if he is not a member of organization in which the workspace is present)
// GET /workspaces/:workspaceId/members — get all members of a workspace