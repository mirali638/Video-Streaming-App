import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { use } from "react";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return { accessToken, refreshToken };
        
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    const {fullName,email,password,username} = req.body
    //console.log("email:" , email);
    
    // validation - no empty fields, valid email, password length, etc.
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "") 
    ){
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists - username or email
    const existedUser = await User.findOne({
        $or: [ { email }, { username }]
    });

    if(existedUser){
        throw new ApiError(409, "User already exists with this email or username");
    };

    // check for image - avatar upload
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }

    // upload them to cloudinary - avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(500, "Avatar image upload failed");
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

    // remove password and refresh token from response
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");
    
    // check for user creation success
    if(!createdUser){
        throw new ApiError(500, "User creation failed");
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const { email,username,password } = req.body;

    // username or email
    if( !username && !email ){
        throw new ApiError(400, "Username or email is required");
    }

    // find the user 
    const user = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    });

    if (!user){
        throw new ApiError(404, "User not found");
    }

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(-password -refreshToken);

    // send cookies
    const option = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "user loggedin successful"
        )
    )
});

const logoutUser = asyncHandler(async (req,res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logged out"
        )
    )
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    //get refresh token
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(incomingRefreshToken){
        throw new ApiError(401,"unauthorized request");
    }

    try {
        //verify incoming token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        
        //take user info
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "invalid refresh token");
        }
    
        //match both tokens
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used");
        }
    
        //generate new access and refresh tokens
        const options ={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res 
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "access tokeon refreshed"
        ))
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,{},"password changed successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullName, email} = req.body;

    if(!fullName && !eamil){
        throw new ApiError(400, "all fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new : true }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "coveer image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage };