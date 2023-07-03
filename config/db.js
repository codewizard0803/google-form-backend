/** @format */

const mongoose = require("mongoose");
const dbURI =
  "mongodb://ec2-13-49-138-23.eu-north-1.compute.amazonaws.com:27017/google-form";

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
