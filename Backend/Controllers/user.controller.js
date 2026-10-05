import jwt from 'jsonwebtoken'
import userModel from '../Models/user.model.js'
import mongoose from 'mongoose'


// User registration :
// Full route : ../api/user/register
export let userRegistration = async (req, res) => {
    try {
        let { email, name, avatar } = req.body

        if (!email || !name) {
            return res.status(400).json({ message: "Email and name are required", success: false })
        }

        let user = await userModel.findOne({ email })
        if (user) { return res.status(400).json({ message: "User already exists with this email", success: false }) }

        let newUser = await userModel.create({ email, name, avatar })

        let token = await jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
        res.cookie("token", token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 })

        res.status(201).json({ message: "User registered successfully", success: true, user: newUser, token })

    } catch (error) {
        console.log("Registration error:", error.message)
        res.status(500).json({ message: "Internal Server Error in user registration api", success: false })
    }
}

// User login :
// Full route : ../api/user/login
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
            user,
            // token
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
export let userUpdate = async () => {
    try {
        let user = req.user

        if (!user || !user?._id || !mongoose.Types.ObjectId.isValid(user?._id)) {
            return res.status(400).json({ message: "User not found", success: false })
        }

        let { name } = req.body
        if (!name) {
            return res.status(400).json({ message: "Name is required", success: false })
        }

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error in user update api", success: false })
    }
}

