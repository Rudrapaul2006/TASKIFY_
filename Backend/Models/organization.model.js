import mongoose, { model, Schema } from 'mongoose'

let workspaceRef = {
    type: Schema.Types.ObjectId,
    ref: 'workspace',
    required: true
}

let userRef = {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
}

let organizationSchema = new Schema({
    name: { type: String, required: true, trim: true },
    workspace: workspaceRef,
    organizationOwner: userRef,
    organizationLeader: userRef,

    privacy: {
        type: String,
        enum: ['private', 'public'],
        required: true
    },
    logo: { type: String }

}, { timestamps: true })

organizationSchema.index(
    { workspace: 1, name: 1 },
    { unique: true }
)

export let organizationModel = model('organization', organizationSchema)


// user has 1 to many relationship with workspace organization :
let organizationMembershipSchema = new Schema({
    user: userRef,
    workspace: workspaceRef,

    organization: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'organization'
    },
    role: {
        type: String,
        enum: ['organization_owner', 'organization_member', 'organization_leader'],
        default: 'organization_member',
        required: true
    }
}, { timestamps: true })

organizationMembershipSchema.index(
    { organization: 1, user: 1 },
    { unique: true }
)
organizationMembershipSchema.index(
    { workspace: 1, user: 1 }
)

export let organizationMembership = model('organizationMembership', organizationMembershipSchema)


// Invitation in organization :
let organizationInvitationSchema = new Schema({
    invitedEmail: { type: String, trim: true, required: true, lowercase: true },
    invitedBy: userRef,

    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'workspace',
        required: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'organization',
        required: true
    },
    role: {
        type: String,
        enum: ['organization_member', 'organization_owner'],
        default: 'organization_member'
    },
    status: {
        type: String,
        enum: ['pending', 'pending_workspace_approval', 'workspace_rejected', 'accepted', 'declined', 'canceled', 'organization_canceled', 'expired'],
        default: 'pending'
    },
    expiresAt: { type: Date, required: true }
}, { timestamps: true })

organizationInvitationSchema.index(
    { organization: 1, invitedEmail: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'pending' }
    }
)

export let organizationInvitation = model('organizationInvitation', organizationInvitationSchema)


// Send req in organization :
// let joiningReqInOrganizationSchema = new Schema({

// })