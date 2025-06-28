import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
import monggose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDb from "./db/index.js";
import { log } from "console";

connectDb()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        log(`Server is running on port ${process.env.PORT || 8000}`);
    });
})
.catch((error) => {
    console.log("mongodb connection error", error);
})