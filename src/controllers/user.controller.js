
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res)=>{
    //  get user details from frontend
    const {username, email, fullName, password} = req.body;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;  
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)
    && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    // validation - not empty
    if(!username || !email || !fullName || !password){
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exist : usrname , email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist");
    }

    // check for images , check for avatar
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    
    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "something went wrong on registring the user")
    }
    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registerd successfully")
    )
})

export { registerUser };
