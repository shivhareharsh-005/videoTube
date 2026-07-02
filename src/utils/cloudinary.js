
import {v2 as cloudinary} from "cloudinary";

 cloudinary.config({ 
    cloud_name: Process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath) =>{
    try{
        if(! localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        // file has been uuploaded successfully
        console.log("file is uploaded on cloudinary", response.url);
        return response
    } catch(error){
           FileSystem.unlinkSync(localFilePath)  // remove the locally saved temprary file as the upload operation got failed
           return null
    }
}

export {uploadOnCloudinary}