
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { application } from "express";
import { configDotenv } from "dotenv";


const generateAccessAndRefreshTokens = async ( userId )=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};

    } catch (error){
        throw new ApiError(500, "something wewnt wrong while generating tokens");
    }
}


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


const loginUser = asyncHandler(async(req, res)=>{
       //  req.body -> data
       //  username or email
       //  find the user
       //  password check
       //  access and refresh token
       //  send cookies

       const { email , username , password } = req.body;
       
       if(!(username || email)) {
        throw new ApiError(400, "username or email is required")
       }

       const user = await User.findOne ({ 
        $or: [{username}, {email}]
       })

       if(! user){
        throw new ApiError(404, "user does not register")
       }
       
       
       const isPasswordValid = await user.isPasswordCorrect(password);
       if(!isPasswordValid) {
        throw new ApiError(401, "Invalid credential");
       }

    

       const {accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

       const loggedInUser = await User.findById(user._id).
       select("-password -refreshToken")

       const options = {
        httpOnly : true,
        secure : process.env.NODE_ENV === "production"
       }

       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", refreshToken, options)
       .json(
           new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "user logged In successfully"
           )
       )
})

const logoutUser = asyncHandler(async(req, res) =>{
       await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
       )
       const options = {
        httpOnly : true,
        secure : process.env.NODE_ENV === "production"
       }
       
       return res
       .status(200)
       .clearCookie("accessToken", options)
       .clearCookie("refreshToken", options)
       .json(new ApiResponse(200, {}, "User loggedout successfully"))

})


const refreshAcessToken = asyncHandler(async ( req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized access");
    }

    try{
        const decodedToken = Jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?.id)

        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly : true,
            secure : true
        }

        const { accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})
export { 
    registerUser,
    loginUser,
    logoutUser
 };
