import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    fullName : {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
        type : String,   // cloudnary url
        required : true,
    },
    coverImage : {
        type : String
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "video"
        }
    ],
    password : {
        type : String,
        required : [true, 'password is required']
    },
    refreshToken : {
        Type : String
    }
},
{
    timeStamps : true
})


// password incription middileware
userSchema.pre("save", async function (next){                    

    if(!this.isModified("password")) return next();              // when password change by user so use password
                                                                 //  hash but any other changes so password hashing not again
    this.password = bcrypt.hash(this.password, 10)
    next()
}) 

// password matching method 
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)                        
}

// generate access token
userSchema.methods.generateAccessToken = function(){

    return jwt.sign(
        // payload
        {
            _id: this._id,
            email: this.email,
            username : this.username,
            fullName : this.fullName
        },

        // secret key
        process.env.ACCESS_TOKEN_SECRET,

        // token expiry time
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){

    return jwt.sign(
        // payload
        {
            _id: this._id,
        },
        
        // secret key
        process.env.REFRESH_TOKEN_SECRET,

        // token expiry time
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)