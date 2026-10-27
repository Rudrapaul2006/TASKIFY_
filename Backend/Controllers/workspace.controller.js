import mongoose, { mongo } from "mongoose";
import userModel from "../Models/user.model.js";
import { workspaceInvitation, workspaceJoinRequest, workspaceMemberShip, workspaceModel } from "../Models/workspace.model.js";
import { uploadImageOnCloudinary } from "../Utils/Cloudinary.js";
import crypto from 'crypto'
import { redisClient } from "../Utils/RedisClint.js";
import { organizationMembership } from "../Models/organization.model.js";




// Creating workspace : [post request] [owner route]
// Full route : ../api/workspace/create
// {workspace_name, privacy} from body
// Returning => createdWorkspace 
export let create_workspace = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({
                message: "Not a valid user",
                success: false
            })
        }

        let { workspace_name, privacy } = req.body
        if (!workspace_name || typeof workspace_name !== 'string' || workspace_name.trim() === '') {
            return res.status(400).json({ message: "Please provide a valid workspace name", success: false })
        }
        workspace_name = workspace_name.trim()

        if (privacy && !['public', 'private'].includes(privacy)) {
            return res.status(400).json({ message: "Privacy must be either 'public' or 'private'", success: false })
        }

        let existing_workspace = await workspaceModel.exists({
            workspaceOwner: user?._id,
            name: workspace_name
        })

        if (existing_workspace) {
            return res.status(400).json({
                message: "You already have a workspace with this name",
                success: false
            })
        }

        let logo = ""
        if (req.file) {
            let uploadedImage = await uploadImageOnCloudinary(req.file.path)

            if (!uploadedImage) {
                return res.status(400).json({ message: "Image upload failed", success: false })
            }

            logo = uploadedImage
        }

        let workspace = await workspaceModel.create({
            workspaceOwner: user?._id,
            name: workspace_name,
            privacy: privacy || 'public',
            logo
        })

        if (!workspace) { return res.status(400).json({ message: "Cant create a workspace", success: false }) }

        let membershipOfWorkspace = await workspaceMemberShip.create({
            user: user?._id,
            role: 'workspace_owner',
            workspace: workspace?._id
        })

        let createdWorkspace = await membershipOfWorkspace.populate(["user", "workspace"])

        // Redis cache:
        let user_Workspaces_Key = `user:${user?._id}:workspaces` // for multiple workspace list [user / member's / owner]
        let user_single_Workspace_Key = `user:${user?._id}:workspace:${workspace?._id}` // for single workspace details [user / member's / owner]

        // the next GET /getall call re-fetches a fresh, complete list from DB
        await redisClient.del(user_Workspaces_Key)
        await redisClient.del(user_single_Workspace_Key)

        return res.status(200).json({
            message: "Workspace created successfully",
            createdWorkspace,
            success: true
        })

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(400).json({
                message: "You already have a workspace with this name",
                success: false
            })
        }
        console.log(error)
        res.status(500).json({
            message: "server error in create workspace api",
            success: false
        })
    }
}


// Get all workspace's : [get request]
// Full route : ../api/workspace/getall
// Returning => workspaces    
export let get_all_workspace = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({
                message: "Please provide a valid authenticated user",
                success: false
            })
        }

        // Check if the user's workspaces are cached in Redis
        let user_Workspaces_Key = `user:${user?._id}:workspaces`  // for multiple workspace list [user / member's / owner]
        let getCachedWorkspacesData = await redisClient.get(user_Workspaces_Key)

        // if (getCachedWorkspacesData) {
        //     let workspaces = JSON.parse(getCachedWorkspacesData)

        //     if (!workspaces || workspaces.length === 0) {
        //         return res.status(400).json({
        //             message: "Can not find workspace with this user",
        //             success: false
        //         })
        //     }

        //     return res.status(200).json({ workspaces, success: true, cached: true })
        // }

        // If not cached, fetch from DB and cache it
        let workspaces = await workspaceMemberShip.find({ user: user?._id }).populate("workspace").select({ user: 0 })
        // Remove dangling membership records whose workspace has already been deleted.
        let staleMembershipIds = workspaces?.filter((membership) => !membership.workspace).map((membership) => membership?._id)
        if (staleMembershipIds.length > 0) {
            await workspaceMemberShip.deleteMany({ _id: { $in: staleMembershipIds } })
            workspaces = workspaces.filter((membership) => membership.workspace)
        }

        await redisClient.setex(user_Workspaces_Key, 300, JSON.stringify(workspaces)) // Cache for 5 minutes (300 seconds)

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
export let get_workspace_by_id = async (req, res) => {
    try {

        let user = req.user
        if (!user || !user._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
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

        // cheak if the workspace details are cached in Redis
        let user_single_Workspace_Key = `user:${user?._id}:workspace:${workspace_id}`
        let getCachedWorkspaceData = await redisClient.get(user_single_Workspace_Key)

        if (getCachedWorkspaceData) {
            let workspace = JSON.parse(getCachedWorkspaceData)

            if (!workspace || workspace.length === 0) return res.status(400).json({ message: "Can not find any workspace with this id", success: false })

            return res.status(200).json({ workspace, success: true, cached: true })
        }

        // If not cached, fetch from DB and cache it

        let workspace = await workspaceMemberShip.find({ user: user?._id, workspace: workspace_id }).populate("user").populate("workspace")
            .populate({
                path: "workspace",
                populate: {
                    path: "workspaceOwner",
                }
            })

        if (workspace.length === 0) {
            return res.status(400).json({
                message: "Can not find any workspace with this id",
                success: false
            })
        }

        await redisClient.setex(user_single_Workspace_Key, 300, JSON.stringify(workspace)) // Cache for 5 minutes (300 seconds)

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


// Update workspace [name and logo] : [put request] [owner route]
// Full route : ../api/workspace/update/:workspaceid
// {updated_workspace_name} from body
// {logo} from file
// Returning => updatedWorkspace
export let update_workspace = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(400).json({
                message: "Plesase provide a valid authenticated user",
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

        let { updated_workspace_name } = req.body
        if (!updated_workspace_name || typeof updated_workspace_name !== 'string' || updated_workspace_name.trim() === '') {
            return res.status(400).json({
                message: "Plesase provide a valid name",
                success: false
            })
        }
        updated_workspace_name = updated_workspace_name.trim()

        let updatedWorkspace = await workspaceModel.findOne({ _id: workspace_id, workspaceOwner: owner?._id })
        if (!updatedWorkspace) {
            return res.status(404).json({
                message: "Workspace not found or you do not have permission to update it",
                success: false
            })
        }

        let existingWorkspace = await workspaceModel.exists({
            workspaceOwner: owner?._id,
            name: updated_workspace_name,
            _id: { $ne: workspace_id }
        })

        if (existingWorkspace) {
            return res.status(400).json({
                message: "This workspace name already exists. Please choose a unique name",
                success: false
            })
        }

        let logo = ''
        if (req.file) {
            let upload_on_cloudinary = await uploadImageOnCloudinary(req.file.path)

            if (!upload_on_cloudinary) { return res.status(400).json({ message: "Image upload failed", success: false }) }

            logo = upload_on_cloudinary
        }

        if (logo) updatedWorkspace.logo = logo
        updatedWorkspace.name = updated_workspace_name
        await updatedWorkspace.save()

        // Redis cache operations :
        // Invalidate all members' caches (including owner) — workspace name changed
        let allMemberships = await workspaceMemberShip.find({ workspace: updatedWorkspace?._id }).select('user').lean()
        for (let membership of allMemberships) {
            let member_id = membership?.user?.toString()
            if (member_id) {
                await redisClient.del(`user:${member_id}:workspaces`)
                await redisClient.del(`user:${member_id}:workspace:${updatedWorkspace?._id}`)
            }
        }

        return res.status(200).json({
            message: "Workspace name updated successfully",
            updatedWorkspace,
            success: true
        })

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(400).json({
                message: "This workspace name already exists. Please choose a unique name",
                success: false
            })
        }
        console.log(error);
        return res.status(500).json({
            message: "server error in update workspace api", success: false
        })
    }
}


// Change user role in workspace : [put request] [owner route] [extra api not needed yet]
// Full route : ../api/workspace/update_role/:workplaceid/:userid
// {role} => from body
// Returning => updatedRole 
export let change_members_role = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(400).json({
                message: "PLease provide a authenticated user",
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        let user_id = req.params.userid

        if (!workspace_id || !user_id || !mongoose.Types.ObjectId.isValid(workspace_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(404).json({
                message: "Please provide a valid workspace ID and user ID",
                success: false
            })
        }

        let { role } = req.body
        let allowedRoles = ['workspace_member']

        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: `Please provide a valid role. Allowed: ${allowedRoles.join(', ')}`,
                success: false
            })
        }

        if (owner?._id.toString() === user_id.toString()) {
            return res.status(400).json({
                message: "Workspace owner cannot change their own role",
                success: false
            })
        }

        let membershipOfOwner = await workspaceMemberShip.findOne({ user: owner?._id, workspace: workspace_id.toString(), role: 'workspace_owner' })
        if (!membershipOfOwner) {
            return res.status(403).json({
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

        await workspaceMemberShip.updateOne(
            { user: user_id, workspace: workspace_id.toString() },
            { $set: { role } }
        )

        let updatedRole = await workspaceMemberShip.findOne({ user: user_id, workspace: workspace_id.toString() }).populate("user", "name email avatar online").populate("workspace", "name logo")

        // Redis cache operations :
        // Invalidate all members' caches (including owner) — role change affects membership data
        let allMemberships = await workspaceMemberShip.find({ workspace: workspace_id })
        for (let membership of allMemberships) {
            let member_id = membership?.user?.toString()
            if (member_id) {
                await redisClient.del(`user:${member_id}:workspaces`)
                await redisClient.del(`user:${member_id}:workspace:${workspace_id}`)
            }
        }

        return res.status(200).json({
            message: "Role updated successfully",
            updatedRole: updatedRole,
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


// Update workspace privacy : [patch request] [owner route]
// Full route : ../api/workspace/update_privacy/:workspaceId
// Body: { privacy: 'public' | 'private' }
// Returning => updatedWorkspace
export let update_workspace_privacy = async (req, res) => {
    try {
        let user = req.user
        if (!user) {
            return res.status(400).json({
                message: "Please provide a valid authenticated user",
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

        // real time data :

        // Redis cache operations :
        // Invalidate each member's cached workspace data once, including the owner
        let allMemberships = await workspaceMemberShip.find({ workspace: workspace_id }).select('user').lean()
        for (let membership of allMemberships) {
            let member_id = membership?.user?.toString()
            if (member_id) {
                await redisClient.del(`user:${member_id}:workspaces`)
                await redisClient.del(`user:${member_id}:workspace:${workspace_id}`)
            }
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




// Owner -> user invitation 

// Helper to expire outdated pending workspace invitations
let expirePendingInvitations = async (filter = {}) => {
    await workspaceInvitation.updateMany(
        {
            ...filter,
            status: 'pending',
            expiresAt: { $lte: new Date() }
        },
        { status: 'expired' }
    )
}

// Helper to expire outdated pending workspace join requests
let expirePendingJoinRequests = async (filter = {}) => {
    await workspaceJoinRequest.updateMany(
        {
            ...filter,
            status: 'pending',
            expiresAt: { $lte: new Date() }
        },
        { status: 'expired' }
    )
}


// Invite a user in workspace : [post request] [owner route]
// Full route : ../api/workspace/send_invitation/:workspaceid
// Invited user email => {email} from body
// Returning => invitation
export let invite_user_in_workspace = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(400).json({ message: "Please provide a valid authenticated workspace owner", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: "Please provide a valid workspace Id", success: false })
        }

        let workspace = await workspaceModel.findById(workspace_id)
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found", success: false })
        }

        let admin_workspace_membership = await workspaceMemberShip.findOne({
            workspace: workspace_id,
            user: owner?._id,
            role: "workspace_owner"
        })
        if (!admin_workspace_membership) {
            return res.status(403).json({
                message: "Only workspace owner can invite a user",
                success: false
            })
        }

        let { email } = req.body
        let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                message: "Please provide a valid user email",
                success: false
            })
        }
        email = email.trim().toLowerCase()

        let invitedUser = await userModel.findOne({ email })
        if (!invitedUser) {
            return res.status(404).json({
                message: "Invited user not found, please tell him to register in taskify",
                success: false
            })
        }

        // cheak user already send an join request
        let joinRequestPending = await workspaceJoinRequest.findOne({
            user: invitedUser?._id,
            workspace: workspace_id,
            status: 'pending'
        })
        if (joinRequestPending) {
            return res.status(409).json({
                message: "This user has already sent a join request to this workspace",
                success: false
            })
        }

        // Check if already a member
        let isAlreadyMember = await workspaceMemberShip.exists({
            workspace: workspace_id,
            user: invitedUser?._id
        })
        if (isAlreadyMember) {
            return res.status(409).json({
                message: "This user is already a member of this workspace",
                success: false
            })
        }

        // expire old pending invitations, then check for an active one
        await expirePendingInvitations({ workspace: workspace_id, invitedEmail: email })

        let pending_invitation = await workspaceInvitation.exists({
            workspace: workspace_id,
            invitedEmail: email,
            status: "pending",
            expiresAt: { $gt: new Date() }
        })
        if (pending_invitation) {
            return res.status(409).json({
                message: "Workspace invitation is already pending for this user",
                success: false
            })
        }

        let rawInvitationToken = crypto.randomBytes(32).toString('hex')
        let hashedInvitationToken = crypto.createHash("sha256").update(rawInvitationToken).digest("hex")

        let createInvitation = await workspaceInvitation.create({
            invitedEmail: email,
            invitedUser: invitedUser?._id,
            invitedBy: owner?._id,
            workspace: workspace_id,
            status: "pending",
            invitationToken: hashedInvitationToken
        })

        let populatedInvitation = await workspaceInvitation.findById(createInvitation?._id).populate("workspace")
            .populate("invitedBy", "name email avatar online")
            .populate("invitedUser", "name email avatar online")
            .lean()




        // send the invitation link through nodemailer :



        // real time data :
        // if (invitedUser) {
        //     let io = req.app.get('io')
        //     if (io) {
        //         io.to(`user_${invitedUser._id}`).emit('newWorkspaceInvitation', {
        //             message: `You have received an invitation to join ${workspace.name}`,
        //             invitation: populatedInvitation
        //         })
        //     }
        // }

        return res.status(200).json({
            message: "Workspace invitation sent successfully",
            invitation: populatedInvitation,
            success: true
        })

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                message: "Workspace invitation is already pending for this user",
                success: false
            })
        }
        console.log(error)
        return res.status(500).json({
            message: "server error in invite user api",
            success: false
        })
    }
}


// Owner can get all sended req [for each workspace] : [get request] [owner route]
// Full route => ../api/workspace/get_sended_invitations/:workspaceid
// Returning => invitation
export let get_all_sended_invitations = async (req, res) => {
    try {
        let { query, sort } = req.query
        query = query.toString().trim() || ''
        sort = sort.toString().trim() || ''

        let owner = req.user
        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
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

        let owner_workspace_membership = await workspaceMemberShip.findOne({
            user: owner?._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })

        if (!owner_workspace_membership) {
            return res.status(403).json({ message: "You are not the workspace owner", success: false })
        }

        // Expire outdated pending invitations before listing
        await expirePendingInvitations({ workspace: workspace_id })

        // A workspace owner can have multiple invitation records, returning history
        let sended_invitation = await workspaceInvitation.find({
            workspace: workspace_id,
            invitedBy: owner?._id,
            status: 'pending'
        }).sort({ createdAt: -1 }).populate("workspace").populate("invitedBy", "name email avatar online")
            .populate("invitedUser", "name email avatar online").lean()

        return res.status(200).json({
            success: true,
            invitation: sended_invitation || []
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "server error in get all user invitation api",
            success: false
        })
    }
}


// Owner can get all types [decline , canceled, expired] sended invitations [for each workspace] : [post request] [owner route]
// Full route => ../api/workspace/get_type_invitations/:workspaceid
// query => {type: ''} ['cancelled' , 'expired', 'declined']
// Returning => invitation
export let invitation_activity_and_history = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let { type } = req.query
        let allowedTypes = ['cancelled', 'expired', 'declined']
        if (type && !allowedTypes.includes(type)) {
            return res.status(400).json({
                message: `Please provide a valid type. Allowed: ${allowedTypes.join(', ')}`,
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
        }

        let owner_workspace_membership = await workspaceMemberShip.findOne({
            user: owner._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })

        if (!owner_workspace_membership) {
            return res.status(403).json({ message: "You are not the workspace owner", success: false })
        }

        // Expire outdated pending invitations before listing
        await expirePendingInvitations({ workspace: workspace_id })

        let countOf = (status) => ({ $sum: { $cond: [{ $eq: ["$status", status] }, 1, 0] } })

        let pipeline = [
            {
                $match: {
                    workspace: new mongoose.Types.ObjectId(workspace_id),
                    invitedBy: new mongoose.Types.ObjectId(owner._id)
                }
            },
            { $sort: { updatedAt: -1 } },
            {
                // ek email = ek row
                $group: {
                    _id: "$invitedEmail",
                    invitedUser: { $first: "$invitedUser" },
                    cancelledCount: countOf('cancelled'),
                    declinedCount: countOf('declined'),
                    expiredCount: countOf('expired'),
                    pendingCount: countOf('pending'),
                    invitations: {
                        $push: { _id: "$_id", status: "$status", createdAt: "$createdAt", updatedAt: "$updatedAt" }
                    }
                }
            }
        ]

        if (type) {
            // is type ki kam se kam 1 invitation ho
            let filter = { [`${type}Count`]: { $gt: 0 } }

            // aur baaki types me se ek bhi na ho (warna wo user hat jayega)
            allowedTypes.filter((t) => t !== type).forEach((t) => { filter[`${t}Count`] = 0 })

            pipeline.push({ $match: filter })
        }

        pipeline.push(
            {
                $addFields: {
                    pendingInvitation: { $gt: ["$pendingCount", 0] },
                    latest: type
                        ? { $first: { $filter: { input: "$invitations", as: "inv", cond: { $eq: ["$$inv.status", type] } } } }
                        : { $first: "$invitations" }
                }
            },
            { $sort: { "latest.updatedAt": -1 } },
            {
                $project: {
                    _id: 0,
                    invitedEmail: "$_id",
                    invitedUser: 1,
                    cancelledCount: 1,
                    declinedCount: 1,
                    expiredCount: 1,
                    pendingInvitation: 1,
                    latest: 1
                }
            }
        )

        let get_invitation_history = await workspaceInvitation.aggregate(pipeline)

        await workspaceInvitation.populate(get_invitation_history, { path: "invitedUser", select: "name email avatar online" })

        return res.status(200).json({ success: true, invitation: get_invitation_history })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "server error in get invitation history api", success: false })
    }
} 


// Owner re-send invitation to user : [post request] : [owner route]
// body => {email: }
// Full route => POST  ../api/workspace/resend_invitation/:workspaceid/:userid
// Returning => invitation
export let resend_invitation_to_user = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(401).json({
                message: 'Please provide a valid owner id ',
                success: false
            })
        }

        let { email } = req.body || {}
        let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                message: 'Please provide a valid email ',
                success: false
            })
        }
        email = email.trim().toLowerCase()

        let workspace_id = req.params.workspaceid
        if (!mongoose.Types.ObjectId.isValid(workspace_id) || workspace_id === '' || !workspace_id) {
            return res.status(403).json({
                message: 'Please provide a valid workspace id',
                success: false
            })
        }

        let user_id = req.params.userid
        if (!mongoose.Types.ObjectId.isValid(user_id) || user_id === '' || !user_id) {
            return res.status(403).json({
                message: 'Please provide a valid user id',
                success: false
            })
        }

        let invitedUser = await userModel.findById(user_id).select('email')
        if (!invitedUser || invitedUser.email?.trim().toLowerCase() !== email) {
            return res.status(404).json({
                message: 'The email does not match the invited user',
                success: false
            })
        }

        let owner_membership = await workspaceMemberShip.findOne({
            user: owner?._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })
        if (!owner_membership) {
            return res.status(400).json({
                message: 'you are not owner of this workspace',
                success: false
            })
        }

        let user_membership = await workspaceMemberShip.findOne({
            user: user_id,
            workspace: workspace_id,
            role: 'workspace_member'
        })
        if (user_membership) {
            return res.status(400).json({
                message: 'Invited user is already a member of this workspace',
                success: false
            })
        }

        // expire old pending invitations, then check for an active one
        await expirePendingInvitations({ workspace: workspace_id })

        let pending_join_request = await workspaceJoinRequest.findOne({
            user: user_id,
            workspace: workspace_id,
            status: 'pending'
        })
        if (pending_join_request) {
            return res.status(400).json({
                message: 'User already has a pending join request',
                success: false
            })
        }

        let user_has_pending_invitation = await workspaceInvitation.findOne({
            invitedUser: user_id,
            workspace: workspace_id,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
        if (user_has_pending_invitation) {
            return res.status(400).json({
                message: 'User already hasa pending invitation',
                success: false
            })
        }

        let rawInvitationToken = crypto.randomBytes(32).toString('hex')
        let hashedInvitationToken = crypto.createHash('sha256').update(rawInvitationToken).digest('hex')

        let resend_invitation = await workspaceInvitation.create({
            invitedUser: user_id,
            invitedBy: owner?._id,
            invitedEmail: email,
            workspace: workspace_id,
            status: 'pending',
            invitationToken: hashedInvitationToken
        })

        let populatedInvitation = await workspaceInvitation.findById(resend_invitation._id).populate('workspace')
            .populate('invitedBy', 'name email avatar online')
            .populate('invitedUser', 'name email avatar online')
            .lean()

        return res.status(200).json({
            message: 'Workspace invitation resent successfully',
            invitation: populatedInvitation,
            success: true
        })

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                message: 'Workspace invitation is already pending for this user',
                success: false
            })
        }
        console.log(error);
        return res.status(500).json({
            message: 'server error in resend invitation api',
            success: false
        })
    }
}

// Cancel the invitation : [patch request] [owner route] 
// Full route => PATCH /api/workspace/:workspaceid/cancel_invitation/:invitationId
// Returning => cancelInvitation
export let cancel_user_invitation = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(400).json({ message: "please provide a valid user", success: false })
        }

        let invitation_id = req.params.invitationid
        let workspace_id = req.params.workspaceid

        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: "Please provide a valid invitation id", success: false })
        }

        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
        }

        let invitation = await workspaceInvitation.findById(invitation_id)
        if (!invitation) {
            return res.status(404).json({ message: "Cant find invitation", success: false })
        }

        if (invitation?.workspace?.toString() !== workspace_id.toString()) {
            return res.status(404).json({ message: "Invitation does not belong to this workspace", success: false })
        }

        let owner_workspace_membership = await workspaceMemberShip.findOne({
            user: owner?._id,
            workspace: invitation?.workspace,
            role: 'workspace_owner'
        })

        if (!owner_workspace_membership) {
            return res.status(403).json({ message: "You are not authorized to cancel user invitation", success: false })
        }

        // Check if expired 
        if (invitation?.status === 'pending' && invitation?.expiresAt && new Date() > invitation?.expiresAt) {
            invitation.status = 'expired'
            await invitation.save()

            return res.status(400).json({ message: "Invitation has expired and cannot be cancelled", success: false })
        }

        // if invitation status is not pending then owner cant cancel it
        if (invitation?.status !== 'pending') {
            return res.status(400).json({ message: `Invitation cannot be cancelled because its status is '${invitation.status}'`, success: false })
        }

        // Set status to cancelled and invitationToken to null 
        invitation.status = 'cancelled'
        invitation.invitationToken = null
        invitation.respondedBy = owner?._id
        invitation.respondedAt = new Date()
        await invitation.save()

        return res.status(200).json({
            message: "Invitation cancelled successfully",
            success: true,
            cancelInvitation: invitation
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "server error in cancel user invitation api",
            success: false
        })
    }
}


// Invited user can get all the invitation for any workspace : [get request] [user route]
// Full route : ../api/workspace/getall_invitation
// Returning => getInvitations
export let get_user_invitations = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user.email) {
            return res.status(400).json({ message: "Please provide a valid authenticated user", success: false })
        }

        let userEmail = user?.email?.trim()?.toLowerCase()

        // Expire outdated pending invitations before listing
        await expirePendingInvitations({ invitedEmail: userEmail })

        let get_invitations = await workspaceInvitation.find({
            invitedEmail: userEmail,
            status: "pending",
            expiresAt: { $gt: new Date() }
        }).populate('workspace').populate('invitedBy', 'name email avatar').sort({ createdAt: -1 })

        return res.status(200).json({
            getInvitations: get_invitations || [],
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
// Returning => acceptInvitation, workspaceId
export let accept_workspace_invitation = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user?.email || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(401).json({ message: "Please sign in before accepting this invitation", success: false })
        }

        let invitation_id = req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: "Please provide a valid invitation id", success: false })
        }

        let userEmail = user.email.trim().toLowerCase()
        let invitation = await workspaceInvitation.findById(invitation_id)

        if (!invitation) {
            return res.status(404).json({ message: "Workspace invitation not found", success: false })
        }

        // Reject acceptance if logged-in email differs from invitation.invitedEmail
        if (invitation.invitedEmail.trim().toLowerCase() !== userEmail) {
            return res.status(403).json({
                message: "Please sign in with the email address that received this invitation.",
                success: false
            })
        }

        // Check if expired
        if (invitation.status === 'expired' || (invitation.expiresAt && new Date() > new Date(invitation.expiresAt))) {
            if (invitation.status === 'pending') {
                invitation.status = 'expired'
                invitation.invitationToken = null
                await invitation.save()
            }
            return res.status(400).json({ message: "Workspace invitation has expired and can no longer be accepted", success: false })
        }

        if (invitation.status === 'cancelled') {
            return res.status(400).json({ message: "Workspace invitation has been cancelled", success: false })
        }

        if (invitation.status === 'accepted') {
            if (invitation.respondedBy && invitation.respondedBy.toString() === user._id.toString()) {
                return res.status(200).json({
                    message: "Workspace invitation already accepted",
                    acceptInvitation: invitation,
                    workspaceId: invitation.workspace,
                    success: true
                })
            }
            return res.status(400).json({ message: "Workspace invitation has already been accepted", success: false })
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: `Workspace invitation cannot be accepted because its status is '${invitation.status}'`, success: false })
        }

        // In this authenticated flow, email ownership is sufficient — do not require or validate raw invitation token.
        let workspace_id = invitation.workspace

        // Check if user is already a workspace member
        let has_workspace_membership = await workspaceMemberShip.findOne({ user: user._id, workspace: workspace_id })
        if (has_workspace_membership) {
            return res.status(400).json({ message: "You are already a member of this workspace", success: false })
        }

        await workspaceMemberShip.create({
            user: user._id,
            role: 'workspace_member',
            workspace: workspace_id
        })

        // Mark invitation as accepted and clear token
        invitation.status = 'accepted'
        invitation.invitationToken = null
        invitation.respondedBy = user._id
        invitation.respondedAt = new Date()
        await invitation.save()

        // Cancel duplicate pending invitations only for the same workspace and invited email
        // Invitations for different workspaces are NOT affected
        await workspaceInvitation.updateMany(
            {
                workspace: workspace_id,
                invitedEmail: userEmail,
                _id: { $ne: invitation._id },
                status: 'pending'
            },
            {
                status: 'cancelled',
                invitationToken: null,
                respondedBy: user._id,
                respondedAt: new Date()
            }
        )

        await workspaceJoinRequest.updateMany(
            {
                workspace: workspace_id,
                user: user._id,
                status: 'pending'
            },
            {
                status: 'cancelled',
                respondedBy: user._id,
                respondedAt: new Date()
            }
        )

        // Invalidate Redis caches for current user and other workspace members
        await redisClient.del(`user:${user._id}:workspaces`)
        await redisClient.del(`user:${user._id}:workspace:${workspace_id}`)

        let allMemberships = await workspaceMemberShip.find({ workspace: workspace_id }).select('user').lean()
        for (let membership of allMemberships) {
            let member_id = membership.user.toString()
            if (member_id !== user._id.toString()) {
                await redisClient.del(`user:${member_id}:workspaces`)
                await redisClient.del(`user:${member_id}:workspace:${workspace_id}`)
            }
        }

        return res.status(200).json({
            message: "Successfully accepted invitation to workspace",
            acceptInvitation: invitation,
            workspaceId: workspace_id,
            success: true
        })

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(400).json({
                message: "You are already a member of this workspace",
                success: false
            })
        }
        console.log("Error accepting workspace invitation:", error)
        return res.status(500).json({
            message: "Server error in workspace invitation accept api",
            success: false
        })
    }
}


// Invited user can decline the invitation for workspace : [post request] [user route]
// Full route : ../api/workspace/decline_invitation/:invitationid
// Returning => declineInvitation
export let decline_workspace_invitation = async (req, res) => {
    try {
        let user = req.user
        if (!user?._id || !user?.email || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a valid authenticated user", success: false })
        }

        let invitation_id = req.params.invitationId || req.params.invitationid
        if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id)) {
            return res.status(400).json({ message: "Please provide a valid invitation id", success: false })
        }

        let user_email = user?.email.trim().toLowerCase()
        let existingInvitation = await workspaceInvitation.findById(invitation_id)

        if (!existingInvitation || existingInvitation.invitedEmail.trim().toLowerCase() !== user_email) {
            return res.status(404).json({ message: "Workspace invitation not found", success: false })
        }

        // Check if expired
        if (existingInvitation.status === 'pending' && existingInvitation.expiresAt && new Date() > existingInvitation.expiresAt) {
            existingInvitation.status = 'expired'
            await existingInvitation.save()

            return res.status(400).json({ message: "Invitation has expired and cannot be declined", success: false })
        }

        // Prevent action on non-pending statuses
        if (existingInvitation.status !== 'pending') {
            return res.status(400).json({ message: `Invitation cannot be declined because its status is '${existingInvitation.status}'`, success: false })
        }

        existingInvitation.status = 'declined'
        existingInvitation.respondedBy = user?._id
        existingInvitation.respondedAt = new Date()
        await existingInvitation.save()

        return res.status(200).json({
            message: "Successfully declined invitation of this workspace",
            declineInvitation: existingInvitation,
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
export let workspace_find_code = async (req, res) => {
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
export let regenerate_workspace_findcode = async (req, res) => {
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

        // Redis cache:
        // Invalidate all members' caches (including owner) — findCode changed
        let allMemberships = await workspaceMemberShip.find({ workspace: workspace_id }).select('user').lean()
        for (let membership of allMemberships) {
            let member_id = membership.user.toString()
            await redisClient.del(`user:${member_id}:workspaces`)
            await redisClient.del(`user:${member_id}:workspace:${workspace_id}`)
        }

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
export let find_workspace_by_findcode = async (req, res) => {
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
                _id: workspace?._id,
                name: workspace?.name,
                logo: workspace?.logo
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
export let send_join_request = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a authenticated user", success: false })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
        }

        let workspace = await workspaceModel.findById(workspace_id)
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found", success: false })
        }

        if (workspace?.workspaceOwner.toString() === user?._id.toString()) {
            return res.status(400).json({ message: "You are the owner of this workspace and cannot send a join request", success: false })
        }

        // users can not send join requests to private workspaces
        if (workspace?.privacy === 'private') {
            return res.status(403).json({ message: "This workspace is private. Join requests are not allowed", success: false })
        }

        let memberShip = await workspaceMemberShip.findOne({ user: user?._id, workspace: workspace?._id })
        if (memberShip) {
            return res.status(400).json({ message: "You are already a member of this workspace", success: false })
        }

        let userEmail = user?.email?.trim().toLowerCase()
        if (userEmail) {
            await expirePendingInvitations({ workspace: workspace_id, invitedEmail: userEmail })

            let pending_invitation = await workspaceInvitation.exists({
                workspace: workspace_id,
                invitedEmail: userEmail,
                status: 'pending',
                expiresAt: { $gt: new Date() }
            })
            if (pending_invitation) {
                return res.status(409).json({ message: "Owner has already invited you. Please accept the invitation", success: false })
            }
        }

        await expirePendingJoinRequests({ workspace: workspace_id, user: user?._id })

        let findPendingReq = await workspaceJoinRequest.exists({
            user: user?._id,
            workspace: workspace_id,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
        if (findPendingReq) {
            return res.status(409).json({ message: "You already have a active pending join request to this workspace", success: false })
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
        if (error?.code === 11000) {
            return res.status(409).json({
                message: "You already have an active pending join request to this workspace",
                success: false
            })
        }
        console.log(error);
        return res.status(500).json({
            message: "server error in workspace join api",
            success: false
        })
    }
}


// User can get his all sended req for workspace : [GET] [user route]
// Full route : ../api/workspace/sended_join_req
// Returning => allSentRequests
export let get_sended_requests = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({
                message: "Please provide a valid user",
                success: false
            })
        }

        // Expire outdated pending join requests before listing
        await expirePendingJoinRequests({ user: user?._id })

        let allSentRequests = await workspaceJoinRequest.find({ user: user?._id }).sort({ createdAt: -1 }).populate("workspace")

        if (allSentRequests.length === 0) {
            return res.status(404).json({ message: "No sent join requests found", success: false })
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


// Cancel join request (user) : [patch] [user route] 
// Full route : PATCH /api/workspace/:workspaceid/cancel_join-request/:joinreqid
export let cancel_join_request = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let workspace_id = req.params.workspaceid
        let joinreq_id = req.params.joinreqid

        if (!joinreq_id || !mongoose.Types.ObjectId.isValid(joinreq_id)) {
            return res.status(400).json({ message: "Please provide a valid join request id", success: false })
        }

        let joinRequest = await workspaceJoinRequest.findOne({ _id: joinreq_id, user: user?._id, workspace: workspace_id })
        if (!joinRequest) {
            return res.status(404).json({ message: "Join request not found", success: false })
        }

        // Check if expired
        if (joinRequest?.status === 'pending' && joinRequest?.expiresAt && new Date() > joinRequest?.expiresAt) {
            joinRequest.status = 'expired'
            await joinRequest.save()

            return res.status(400).json({ message: "Join request has expired and cannot be cancelled", success: false })
        }

        if (joinRequest.status !== 'pending') {
            return res.status(400).json({
                message: `Join request cannot be cancelled because its status is '${joinRequest.status}'`,
                success: false
            })
        }

        joinRequest.status = 'cancelled'
        joinRequest.respondedBy = user?._id
        joinRequest.respondedAt = new Date()
        await joinRequest.save()

        return res.status(200).json({
            message: "Join request cancelled successfully",
            success: true,
            cancelledRequest: joinRequest
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Server error while cancelling join request",
            success: false
        })
    }
}


// Workspace owner gets join req of user : [get request] [admin route]
// Full route : ../api/workspace/joining_requests/:workspaceid
// Returning => pendingRequests
export let get_your_pending_requests = async (req, res) => {
    try {
        let owner = req.user
        let workspace_id = req.params.workspaceid

        if (!owner || !owner?._id || !mongoose.Types.ObjectId.isValid(owner?._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({ message: "Please provide a valid workspace id", success: false })
        }

        let owner_Membership_in_workspace = await workspaceMemberShip.findOne({
            user: owner?._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })

        if (!owner_Membership_in_workspace) {
            return res.status(403).json({ message: 'You are not workspace owner', success: false })
        }

        // Expire outdated pending join requests before listing
        await expirePendingJoinRequests({ workspace: workspace_id })

        let pendingRequests = await workspaceJoinRequest.find({
            workspace: workspace_id,
            status: 'pending'
        }).populate('user', 'name email avatar online').sort({ createdAt: -1 })

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


// admin can accept user join req for workspace [post request] [admin route]
// Full route : ../api/workspace/accept_joiningreq/:joinreqid
// Returning => createUserMemberShip, pendingReq
export let owner_accept_join_request = async (req, res) => {
    try {
        let owner = req.user
        if (!owner || !mongoose.Types.ObjectId.isValid(owner._id)) {
            return res.status(400).json({ message: "Please provide a valid user", success: false })
        }

        let joinreq_id = req.params.joinreqid
        if (!joinreq_id || !mongoose.Types.ObjectId.isValid(joinreq_id)) {
            return res.status(400).json({ message: "Please provide a valid join request id", success: false })
        }

        let joiningRequest = await workspaceJoinRequest.findById(joinreq_id)
        if (!joiningRequest) {
            return res.status(404).json({ message: "Joining request not found", success: false })
        }

        let user_id = joiningRequest?.user
        let workspace_id = joiningRequest?.workspace

        let memberShipOfOwner = await workspaceMemberShip.findOne({
            user: owner?._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })
        if (!memberShipOfOwner) {
            return res.status(403).json({
                message: 'You are not workspace owner',
                success: false
            })
        }

        // Check if expired
        if (joiningRequest?.status === 'pending' && joiningRequest?.expiresAt && new Date() > joiningRequest?.expiresAt) {
            joiningRequest.status = 'expired'
            await joiningRequest.save()

            return res.status(400).json({
                message: "Joining request has expired and cannot be accepted",
                success: false
            })
        }

        if (joiningRequest?.status !== 'pending') {
            return res.status(400).json({
                message: `Joining request cannot be accepted because its status is '${joiningRequest.status}'`,
                success: false
            })
        }

        // Check the requester did not become a member already
        let existingMembership = await workspaceMemberShip.findOne({
            user: user_id,
            workspace: workspace_id
        })

        if (existingMembership) {
            return res.status(409).json({ message: "User is already member of this workspace", success: false })
        }

        let createUserMemberShip = await workspaceMemberShip.create({
            user: user_id,
            workspace: workspace_id,
            role: 'workspace_member'
        })

        joiningRequest.status = 'accepted'
        joiningRequest.respondedBy = owner._id
        joiningRequest.respondedAt = new Date()
        await joiningRequest.save()

        // Set any other pending invitation or join request for the same user and workspace to cancelled
        await workspaceJoinRequest.updateMany(
            {
                workspace: workspace_id,
                user: user_id,
                _id: { $ne: joiningRequest._id },
                status: 'pending'
            },
            {
                status: 'cancelled',
                respondedBy: owner._id,
                respondedAt: new Date()
            }
        )

        let requesterUser = await userModel.findById(user_id).select('email')
        if (requesterUser?.email) {
            await workspaceInvitation.updateMany(
                {
                    workspace: workspace_id,
                    invitedEmail: requesterUser.email.trim().toLowerCase(),
                    status: 'pending'
                },
                {
                    status: 'cancelled',
                    invitationToken: null,
                    respondedBy: owner._id,
                    respondedAt: new Date()
                }
            )
        }

        // Redis cache:
        // Invalidate all members' caches (including owner) — new member joined
        let allMemberships = await workspaceMemberShip.find({ workspace: workspace_id }).select('user').lean()
        for (let membership of allMemberships) {
            let member_id = membership.user.toString()

            await redisClient.del(`user:${member_id}:workspaces`)
            await redisClient.del(`user:${member_id}:workspace:${workspace_id}`)
        }

        return res.status(200).json({
            message: "Successfully accepted user joining request",
            success: true,
            createUserMemberShip,
            acceptedRequest: joiningRequest
        })

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                message: "User is already member of this workspace",
                success: false
            })
        }
        console.log(error);
        return res.status(500).json({
            message: "server error in accept user joining request for workspace api",
            success: false
        })
    }
}


// admin can decline user joining req for workspace [post request] [admin route]
// Full route : ../api/workspace/decline_joiningreq/:joinreqid
// Returning => declineRequest
export let owner_decline_join_request = async (req, res) => {
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

        let joiningRequest = await workspaceJoinRequest.findById(joinReq_id)
        if (!joiningRequest) {
            return res.status(404).json({
                message: "Joining request not found",
                success: false
            })
        }

        let user_id = joiningRequest?.user
        let workspace_id = joiningRequest?.workspace

        let owner_membership = await workspaceMemberShip.findOne({
            user: owner._id,
            workspace: workspace_id,
            role: 'workspace_owner'
        })
        if (!owner_membership) {
            return res.status(403).json({
                message: 'You are not workspace admin/owner',
                success: false
            })
        }

        // Check if expired
        if (joiningRequest?.status === 'pending' && joiningRequest?.expiresAt && new Date() > joiningRequest?.expiresAt) {
            joiningRequest.status = 'expired'
            await joiningRequest.save()

            return res.status(400).json({
                message: "Joining request has expired and cannot be declined",
                success: false
            })
        }

        if (joiningRequest.status !== 'pending') {
            return res.status(400).json({
                message: `Joining request cannot be declined because its status is '${joiningRequest?.status}'`,
                success: false
            })
        }

        joiningRequest.status = 'declined'
        joiningRequest.respondedBy = owner?._id
        joiningRequest.respondedAt = new Date()
        await joiningRequest.save()

        return res.status(200).json({
            message: "Successfully declined user joining request",
            success: true,
            declineRequest: joiningRequest
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "server error in decline user joining request for workspace api",
            success: false
        })
    }
}




// General Route's :

// Get all members of a workspace [get request] [admin and user route]
// Full route : ../api/workspace/get_all_members/:workspaceid
// Returning => allMembers, membersCount
export let get_all_workspace_members = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({
                message: "Please provide a valid authenticated user",
                success: false
            })
        }

        // search query :
        let { query, sort } = req.query
        query = query.toString().trim() || ''
        sort = sort.toString().trim() || ''


        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: "Please provide a valid workspace id",
                success: false
            })
        }

        let requesterMembership = await workspaceMemberShip.findOne({
            workspace: workspace_id,
            user: user._id
        })
        if (!requesterMembership) {
            return res.status(403).json({
                message: "You are not authorized to view members of this workspace",
                success: false
            })
        }

        let allMembers = await workspaceMemberShip.find({ workspace: workspace_id }).populate('user', 'name email avatar online')
        if (!allMembers || allMembers.length === 0) {
            return res.status(404).json({
                message: "No members found in this workspace",
                success: false
            })
        }

        // let io = req.app.get('io')

        return res.status(200).json({
            success: true,
            allMembers,
            membersCount: allMembers.length
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error in fetching workspace members",
            success: false
        })
    }
}


// user leave from workspace : [patch request] [user route]
// Full route : ../api/workspace/leave/:workspaceid
export let leave_workspace = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({
                message: 'Please provide a authorize user',
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: 'Please provide a valid workspace id',
                success: false
            })
        }

        let user_membership_in_workspace = await workspaceMemberShip.findOne({
            workspace: workspace_id,
            user: user?._id
        })

        if (!user_membership_in_workspace) {
            return res.status(400).json({
                message: 'you are not a member of this workspace',
                success: false
            })
        }

        if (user_membership_in_workspace.role === 'workspace_owner') {
            return res.status(400).json({
                message: 'you are the owner of this workspace',
                success: false
            })
        }

        // delete user's membership with organization :
        await organizationMembership.deleteMany({
            user: user?._id,
            workspace: workspace_id
        })

        // Snapshot all remaining members BEFORE deleting so we can clear their caches
        let remainingMembers = await workspaceMemberShip.find({ workspace: workspace_id }).select('user').lean()

        await workspaceMemberShip.deleteOne({
            workspace: workspace_id,
            user: user?._id
        })

        // remove redis key's of workspace :
        // Clear the leaving user's own cache first
        await redisClient.del(`user:${user._id}:workspaces`)
        await redisClient.del(`user:${user._id}:workspace:${workspace_id}`)

        // Clear remaining members' caches
        for (let member of remainingMembers) {
            let member_id = member?.user?.toString()

            if (member_id && member_id !== user._id.toString()) {
                await redisClient.del(`user:${member_id}:workspaces`)
                await redisClient.del(`user:${member_id}:workspace:${workspace_id}`)
            }
        }

        return res.status(200).json({
            message: 'Successfully leave the workspace and organizations',
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "server error in leave workspace api",
            success: false
        })
    }
}


// kick a user from workspace : [patch request] [owner route]
// Full route : ../api/workspace/remove_member/:workspaceid/:userid
export let remove_user_from_workspace = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({
                message: 'please provide a authorize user',
                success: false
            })
        }

        let workspace_id = req.params.workspaceid
        if (!workspace_id || !mongoose.Types.ObjectId.isValid(workspace_id)) {
            return res.status(400).json({
                message: 'Please provide a valid workspace id',
                success: false
            })
        }

        let kicked_user_id = req.params.userid
        if (!kicked_user_id || !mongoose.Types.ObjectId.isValid(kicked_user_id)) {
            return res.status(400).json({
                message: 'Please provide a valid user id',
                success: false
            })
        }

        let user_membership_in_workspace = await workspaceMemberShip.findOne({
            workspace: workspace_id,
            user: user?._id,
            role: 'workspace_owner'
        })
        if (!user_membership_in_workspace) {
            return res.status(403).json({
                message: 'You are not authorized to perform this action',
                success: false
            })
        }

        if (user?._id.toString() === kicked_user_id.toString()) {
            return res.status(400).json({
                message: 'You cannot kick yourself',
                success: false
            })
        }

        let kicked_user_membership = await workspaceMemberShip.findOne({
            workspace: workspace_id,
            user: kicked_user_id,
            role: 'workspace_member'
        })
        if (!kicked_user_membership) {
            return res.status(400).json({
                message: 'user is not a member of this workspace',
                success: false
            })
        }

        // if user is org member in some organization in this workspace, remove him from org membership first
        let user_organization_membership = await organizationMembership.findOne({
            workspace: workspace_id,
            user: kicked_user_id,
            role: { $in: ['organization_member', 'organization_owner'] }
        })
        if (user_organization_membership) {
            return res.status(400).json({
                message: 'Cant remove a user who has membership of organization',
                success: false
            })
        }

        await workspaceMemberShip.deleteOne({
            workspace: workspace_id,
            user: kicked_user_id
        })

        // Clear the kicked user's cache immediately
        await redisClient.del(`user:${kicked_user_id}:workspaces`)
        await redisClient.del(`user:${kicked_user_id}:workspace:${workspace_id}`)

        // Clear all remaining members' caches (both list and single-workspace keys)
        let members = await workspaceMemberShip.find({ workspace: workspace_id }).select('user').lean()
        for (let member of members) {
            let member_id = member?.user?.toString()

            if (member_id) {
                await redisClient.del(`user:${member_id}:workspaces`)
                await redisClient.del(`user:${member_id}:workspace:${workspace_id}`)
            }
        }

        return res.status(200).json({
            message: 'Successfully removed user from workspace',
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'server error in removing user from workspace api',
            success: false
        })
    }
}


// Delete workspace :
// DELETE /workspaces/:workspaceId/members/:userId — remove member from workspace
// (if he is not the owner and if he is not a member of organization in which the workspace is present) [remember to delete the redis cache key for the workspace and the user]


