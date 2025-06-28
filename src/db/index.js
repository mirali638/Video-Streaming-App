import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { log } from "console";

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n Mongodb connected!! DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("mongodb conection error", error);
        process.exit(1);
        
    }
}

export default connectDb;