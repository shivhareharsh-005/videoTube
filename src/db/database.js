
import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

dotenv.config();
const connectDB = async () => {
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("\n MongoDB connected !!")

    } catch (error) {
        console.log("Mongodb connection error", error);
        process.exit(1);
    }
};

export default connectDB;