import express from 'express'
import { userRegistration, userLogin, userLogout, getProfile } from '../Controllers/user.controller.js'
import { protection } from '../Authentication/Auth.js'
import { upload } from '../Utils/Multer.js'

let UserRouter = express.Router()

// User Routes
UserRouter.post('/register', userRegistration)
UserRouter.post('/login', userLogin)
UserRouter.get('/logout', protection, userLogout)

UserRouter.get('/profile', protection, getProfile)
// UserRouter.put('/update', protection, upload.single("image"), updateProfile)

export default UserRouter
