import dotenv from "dotenv";
dotenv.config({
    path: "./env"
})
import monggose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDb from "./db/index.js";

connectDb();