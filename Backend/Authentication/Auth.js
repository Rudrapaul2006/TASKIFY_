import jwt from 'jsonwebtoken'
import userModel from '../Models/user.model.js'

export let protection = async (req, res, next) => {
    try {
        let token = req.cookies?.token || req.headers.authorization?.split(" ")[1]

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided", success: false })
        }

        let decoded = jwt.verify(token, process.env.JWT_SECRET)
        let userId = decoded.id || decoded._id

        let user = await userModel.findById(userId)
        if (!user) { return res.status(401).json({ message: "User not found or unauthenticated", success: false }) }

        req.user = user
        req.id = user._id
        next()

    } catch (error) {
        console.log("Auth error:", error.message)
        return res.status(401).json({ message: "Unauthorized - Invalid or expired token", success: false })
    }
}
