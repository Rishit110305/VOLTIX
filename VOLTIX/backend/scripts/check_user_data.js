import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const checkUsers = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB. User fetching script running...");

    const users = await User.find().sort({ createdAt: -1 }).limit(5);

    if (users.length === 0) {
      console.log("No users found in database.");
    } else {
      console.log(`\nFound ${users.length} most recent users:\n`);
      users.forEach((user) => {
        console.log("-----------------------------------------");
        console.log(`Mongo ID:   ${user._id}`);
        console.log(`UserID:     ${user.userId}`);
        console.log(`Name:       ${user.profile?.name}`);
        console.log(`Email:      ${user.profile?.email}`);
        console.log(
          `Verified:   Email: ${user.authentication?.isEmailVerified}, Phone: ${user.authentication?.isPhoneVerified}`,
        );
        console.log(`Plan:       ${user.subscription?.plan}`);
        console.log(`Last Login: ${user.authentication?.lastLogin}`);
        console.log("-----------------------------------------");
      });
    }
    process.exit(0);
  } catch (error) {
    console.error("Error fetching users:", error);
    process.exit(1);
  }
};

checkUsers();
