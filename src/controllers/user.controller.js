import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    const {fullName,email,password,username} = req.body
    console.log("email:" , email);
    
    // validation - no empty fields, valid email, password length, etc.
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "") 
    ){
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists - username or email
    const existedUser = User.findOne({
        $or: [ { email }, { username }]
    });

    if(existedUser){
        throw new ApiError(409, "User already exists with this email or username");
    };

    // check for image - avatar upload
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser };