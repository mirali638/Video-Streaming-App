import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    //Get the content from req.body.
    const { content } = req.body;

    //Get the user ID from req.user.
    const userId = req.user._id;

    if(!content){
        throw new ApiError(400, "content is required");
    }

    //Create a new tweet using the Tweet model with content and user ID.
    const newTweet = await Tweet.create({
        content,
        owner:userId
    })

    //Send a success response.
    return res.status(200).json(new ApiResponse(200,{},"tweet is created"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //Get the user ID from req.params or req.user.
    const userId = req.params.userId;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid user id");
    }

    //Find all tweets from the Tweet model where owner/user is that ID.
    const tweets = await Tweet.find({ owner: userId });

    //Send those tweets in the response.
    return res.status(200).json(new ApiResponse(200,{tweets},"tweet fetched successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    //Get the tweet ID from req.params.
    const tweetId = req.params.tweetId;
    const { content } = req.body;

    //Find the tweet from the database using that ID.
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400,"tweet not found");
    }

    //Check if the logged-in user is the one who created the tweet.
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403,"You can only update your own tweets");
    }

    //Update the content 
    tweet.content = content || tweet.content;
    await tweet.save();

    //send the updated tweet.
    return res.status(200).json(new ApiResponse(200,{tweet},"tweet update successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    //Get the tweet ID from req.params.
    const tweetId = req.params.tweetId;

    //Find the tweet from the database using that ID.
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400,"tweet not found");
    }

    //Check if the logged-in user is the one who created the tweet.
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403,"You can only delete your own tweets");
    }

    //Delete the tweet from the database.
    await tweet.deleteOne();

    //Send a success message.
    return res.status(200).json(new ApiResponse(200,{},"tweets deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}