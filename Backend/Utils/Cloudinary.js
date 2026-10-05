import { v2 as clodinary } from "cloudinary";

clodinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export let uploadImageOnCloudinary = async (file) => {
    try {
        if (!file) {
            throw new Error("No file provided")
        }

        let result = await clodinary.uploader.upload(file , {
            resource_type: "auto",
            // max_file_size: 7000000, // 2MB
        })

        if (!result) {
            throw new Error("Image upload failed")
        }

        return result.secure_url

    } catch (err) {
        throw new Error("Internal server error")
    }
}
