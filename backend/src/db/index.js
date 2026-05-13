import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is required");
    }

    const connectionInstance = await mongoose.connect(
      process.env.MONGODB_URI.includes("/")
        ? process.env.MONGODB_URI
        : `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      ` MongoDB connected! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
