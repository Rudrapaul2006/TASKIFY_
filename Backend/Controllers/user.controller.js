import jwt from 'jsonwebtoken'
import userModel from '../Models/user.model.js'
import mongoose from 'mongoose'
import { uploadImageOnCloudinary } from '../Utils/Cloudinary.js'
import { workspaceInvitation, workspaceMemberShip, workspaceModel } from '../Models/workspace.model.js'
import { redisClient } from "../Utils/RedisClint.js";

// User registration :
// Full route : ../api/user/register
// body => {email, name, avatar}
// returning => user
export let userRegistration = async (req, res) => {
    try {
        let { email, name, avatar, invitation_token, invitation_id } = req.body

        if (!email || !name) {
            return res.status(400).json({ message: "Email and name are required", success: false })
        }

        let normalizedEmail = email.trim().toLowerCase()

        let user = await userModel.findOne({ email: normalizedEmail })
        if (user) { return res.status(409).json({ message: "User already exists with this email", success: false }) }

        // let invitationLink = `${process.env.CLIENT_URL}/signup?invitation_token=${encodeURIComponent(invitation_token)}&invited_email=${encodeURIComponent(email)}&invitation_id=${invitation._id}`
        let invitation = null

        // cheak the user has invitation or not
        if (invitation_id || invitation_token) {
            if (!invitation_id || !mongoose.Types.ObjectId.isValid(invitation_id) || !invitation_token?.trim()) {
                return res.status(400).json({ message: "Invalid invitation id", success: false })
            }

            let hashed_invitation_token = crypto.createHash("sha256").update(String(invitation_token).trim()).digest("hex")

            invitation = await workspaceInvitation.findOne({
                _id: invitation_id,
                invitationToken: hashed_invitation_token,
                invitedEmail: normalizedEmail,
                status: 'pending',
                expiresAt: { $gt: new Date() }
            })

            if (!invitation) { return res.status(400).json({ message: "Invitation not found or invitation is expired ", success: false }) }

            // cheak the google signup email and invited email are same or not 
            if (normalizedEmail !== invitation?.invitedEmail.toLocaleLowerCase().trim()) {
                return res.status(400).json({ message: `Please signup with ${invitation?.invitedEmail} this email address to accept the invitation`, success: false })
            }
        }

        let newUser = await userModel.create({ email: normalizedEmail, name, avatar, coverAvatar: 'https://placehold.co/1500x500/png?text=Cover' })


        let joined_workspace = null
        // if user has invitation then accept invitation and create workspace membership :
        if (invitation) {
            invitation.status = 'accepted'
            invitation.invitationToken = null
            invitation.respondedBy = newUser?._id
            invitation.respondedAt = new Date()
            await invitation.save()


            await workspaceMemberShip.create({
                user: newUser?._id,
                workspace: invitation?.workspace,
                role: 'workspace_member'
            })

            joined_workspace = await workspaceModel.findById(invitation?.workspace).select('name')
        }

        let token = await jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
        res.cookie("token", token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 })

        res.status(201).json({
            message: joined_workspace ? `User registered successfully and joined ${joined_workspace?.name}` : "User registered successfully",
            success: true,
            user: newUser
        })

    } catch (error) {
        console.log("Registration error:", error.message)
        res.status(500).json({ message: "Internal Server Error in user registration api", success: false })
    }
}

// User login :
// Full route : ../api/user/login
// returning => user
export let userLogin = async (req, res) => {
    try {
        let { email } = req.body

        if (!email) { return res.status(400).json({ message: "Email is required", success: false }) }

        let user = await userModel.findOne({ email })
        if (!user) { return res.status(400).json({ message: "User not found", success: false }) }

        let token = await jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie("token", token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 })

        res.status(200).json({
            message: `${user.name || "User"} logged in successfully`,
            success: true,
            user
        })

    } catch (error) {
        console.log("Login error:", error.message)
        res.status(500).json({ message: "Internal Server Error in user login api", success: false })
    }
}

// User logout :
// Full route : ../api/user/logout
export let userLogout = async (req, res) => {
    try {
        let user = req.user
        if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "User not found", success: false })
        }

        res.clearCookie("token", {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        })

        return res.status(200).json({ message: `${user?.name || "User"} logged out successfully`, success: true })

    } catch (error) {
        console.log("Logout error:", error.message)
        res.status(500).json({ message: "Internal Server Error in user logout api", success: false })
    }
}

// User profile :
// Full route : ../api/user/profile
// returning => user
export let getProfile = async (req, res) => {
    try {
        let user = req.user

        if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(404).json({ message: "User not found", success: false })
        }

        res.status(200).json({ success: true, user })

    } catch (error) {
        console.log("Get profile error:", error.message)
        res.status(500).json({ message: "Internal Server Error in getting user profile", success: false })
    }
}


// User profile update :
// body => {name}
// file => logo
// returning => user
// Full route : ../api/user/update
export let userUpdate = async (req, res) => {
    try {
        let user = req.user

        if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "User not found", success: false })
        }

        let { name } = req.body

        if ((!name || !name.trim()) && !req?.file) {
            return res.status(400).json({ message: "Name or profile image is required", success: false })
        }

        let logo = ''
        if (req.file) {
            let upload_on_cloudinary = await uploadImageOnCloudinary(req.file?.path)
            if (!upload_on_cloudinary) {
                return res.status(400).json({ message: "Something went wrong while uploading file", success: false })
            }
            logo = upload_on_cloudinary
        }

        let logged_in_user = await userModel.findById(user?._id)
        if (!logged_in_user) {
            return res.status(404).json({ message: "User not found", success: false })
        }

        if (name) logged_in_user.name = name.trim()
        if (logo) logged_in_user.avatar = logo

        await logged_in_user.save()

        redisClient.del(`user:${logged_in_user?._id}:workspaces`)
        redisClient.del(`user:${logged_in_user?._id}:joined_workspaces`)

        return res.status(200).json({
            message: "User profile updated successfully",
            success: true,
            user: logged_in_user
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error in user update api", success: false })
    }
}


// cover pic update : 
// Full route : ../api/user/update_cover_image
export let updateCoverImage = async (req, res) => {
    try {
        let user = req.user
        if (!user || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "User not found", success: false })
        }


        let cover = ''
        if (req.file) {
            let upload_on_cloudinary = await uploadImageOnCloudinary(req.file?.path)
            if (!upload_on_cloudinary) {
                return res.status(400).json({ message: "Something went wrong while uploading file", success: false })
            }
            cover = upload_on_cloudinary
        }

        let logged_in_user = await userModel.findById(user?._id)
        if (!logged_in_user) {
            return res.status(404).json({ message: "User not found", success: false })
        }

        if (cover) logged_in_user.coverAvatar = cover
        await logged_in_user.save()

        redisClient.del(`user:${logged_in_user?._id}:workspaces`)
        redisClient.del(`user:${logged_in_user?._id}:joined_workspaces`)

        return res.status(200).json({
            message: "User cover image updated successfully",
            success: true,
            user: logged_in_user
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'server error in update cover image api',
            success: false
        })
    }
} 

// Check if user exists by email
// Full route : ../api/user/check_user?email=
export let checkUserExists = async (req, res) => {
    try {
        let { email } = req.query
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: "Email is required", success: false })
        }

        let normalizedEmail = email.trim().toLowerCase()
        let user = await userModel.findOne({ email: normalizedEmail })

        return res.status(200).json({
            exists: !!user,
            success: true
        })

    } catch (error) {
        console.log("Check user error:", error.message)
        return res.status(500).json({ message: "Internal server error in check user api", success: false })
    }
}
