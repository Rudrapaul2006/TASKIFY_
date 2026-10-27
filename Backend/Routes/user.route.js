import express from 'express'
import { userRegistration, userLogin, userLogout, getProfile, userUpdate, checkUserExists, updateCoverImage } from '../Controllers/user.controller.js'
import { protection } from '../Authentication/Auth.js'
import { upload } from '../Utils/Multer.js'

let UserRouter = express.Router()

// User Routes
UserRouter.get('/check_user', checkUserExists)

UserRouter.post('/register', userRegistration)
UserRouter.post('/login', userLogin)
UserRouter.get('/logout', protection, userLogout)

UserRouter.get('/profile', protection, getProfile)
UserRouter.put('/update', protection, upload.single('logo'), userUpdate)
UserRouter.put('/update_cover_image', protection, upload.single('coverImage'), updateCoverImage)

export default UserRouter
