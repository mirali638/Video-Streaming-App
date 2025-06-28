import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, // Allow cookies to be sent with requests
}));
app.use(cookieParser());
app.use(express.json({
    limit: "16kb", // Increase the limit to 16kb
}));
app.use(express.urlencoded({
    limit: "16kb", // Increase the limit to 16kb
    extended: true,
}));
app.use(express.static("public")); // Serve static files from the 'public' directory

export { app };