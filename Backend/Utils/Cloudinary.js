import { v2 as clodinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export let uploadImageOnCloudinary = async (file) => {
    try {
        if (!file) {
            throw new Error("No file provided")
        }

        let filename = path.basename(file)
        let serverUrl = (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '')

        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            clodinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            })

            try {
                let result = await clodinary.uploader.upload(file, {
                    resource_type: "auto",
                })

                // if (result?.secure_url) {
                //     // Delete local file after successful Cloudinary upload
                //     fs.unlink(file, () => {})
                //     return result.secure_url
                // }
            } catch (cloudErr) {
                console.error("Cloudinary upload failed, falling back to local storage:", cloudErr?.message || cloudErr)
                return `${serverUrl}/uploads/${filename}`
            }
        }

        return `${serverUrl}/uploads/${filename}`

    } catch (err) {
        console.error("uploadImageOnCloudinary error:", err?.message || err)
        throw new Error("Internal server error")
    }
}

