import mongoose from 'mongoose'
import { Schema, model } from 'mongoose'
import crypto from 'crypto'

let userRef = {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
}

let optionalUserRef = {
    type: Schema.Types.ObjectId,
    ref: 'user',
    default: null
}

// Workspace :
let workspaceSchema = new Schema({
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    workspaceOwner: userRef, // The user who create workspace [access the workspace]

    findCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(5).toString('hex').toUpperCase() // e.g. "A3F9C2"
    },
    privacy: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    }
}, { timestamps: true })

workspaceSchema.index(
    { workspaceOwner: 1, name: 1 },
    { unique: true }
)

export let workspaceModel = model('workspace', workspaceSchema)


// Every user has 1 to 1 membership with each workspace :
let workspaceMembershipSchema = new Schema({
    user: userRef,
    role: {
        type: String,
        enum: ['workspace_owner', 'workspace_member'],
        default: 'workspace_member'
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'workspace',
        required: true
    }
}, { timestamps: true })

workspaceMembershipSchema.index(
    { user: 1, workspace: 1 },
    { unique: true }
)

export let workspaceMemberShip = model('workspaceMembership', workspaceMembershipSchema)


// Invitation in workspace : (admin can send invitation to user)
let workspaceInvitationSchema = new Schema({
    invitedEmail: { type: String, trim: true, required: true, lowercase: true },
    invitedUser: userRef,
    invitedBy: userRef,

    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'workspace',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
        default: 'pending',
    },

    respondedBy: optionalUserRef, //user who respond this invitation or null
    respondedAt: {
        type: Date,
        default: null
    },

    invitationToken: {
        type: String
    },

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry by default
    }
}, { timestamps: true })

workspaceInvitationSchema.index(
    { workspace: 1, invitedEmail: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'pending' }
    }
)

export let workspaceInvitation = model("workspaceInvitation", workspaceInvitationSchema)


// user can send joining request to workspace :
let joiningRequestInWorkspaceSchema = new Schema({
    user: userRef, // user who send request

    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'workspace',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
        default: 'pending',
    },

    respondedBy: optionalUserRef, //owner
    respondedAt: {
        type: Date,
        default: null
    },

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry by default
    }
}, { timestamps: true })

joiningRequestInWorkspaceSchema.index(
    { workspace: 1, user: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'pending' }
    }
)

export let workspaceJoinRequest = model("workspaceJoinRequest", joiningRequestInWorkspaceSchema)