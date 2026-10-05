import mongoose from "mongoose";

let userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    avatar: {
        type: String,
    },
    
    socketId: {
        type: String,
    },
    online: {
        type: Boolean,
        default: false
    }
} , { timestamps: true })

let userModel = mongoose.model('user', userSchema)
export default userModel
    