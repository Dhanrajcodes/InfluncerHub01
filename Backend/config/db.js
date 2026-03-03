//config/db.js
import mongoose from "mongoose";

const getMongoUri = () => {
  const rawValue = (process.env.MONGO_URI || "").trim();

  if (!rawValue) {
    return "mongodb://127.0.0.1:27017/influencerhub";
  }

  if (!rawValue.startsWith("mongodb://") && !rawValue.startsWith("mongodb+srv://")) {
    return `mongodb://${rawValue}/influencerhub`;
  }

  return rawValue;
};

const connectDB = async () => {
  try {
    await mongoose.connect(getMongoUri());
    console.log("MongoDB connected");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
