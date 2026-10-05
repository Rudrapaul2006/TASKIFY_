import mongoose from 'mongoose'
import { Schema, model } from 'mongoose'
import crypto from 'crypto'

let userRef = {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
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
        enum: ['workspace_owner', 'workspace_member', 'organization_creator'],
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
    invitedEmail: { type: String, trim: true, required: true },
    invitedBy: userRef,
    invitedFrom: { type: String, trim: true, required: true }, // who invite a user in workspace ['workspace_owner' only]

    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'workspace',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'decline'],
        default: 'pending',
        // required: true
    }
}, { timestamps: true })

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
        enum: ['pending', 'accepted', 'decline'],
        default: 'pending',
        // required: true
    },

    respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    } //workspace owner
}, { timestamps: true })

export let workspaceJoinRequest = model("workspaceJoinRequest", joiningRequestInWorkspaceSchema)