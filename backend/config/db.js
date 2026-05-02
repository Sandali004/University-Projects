import mongoose from 'mongoose';
import dns from "node:dns";

// Fix for Node.js IPv6 DNS resolution issues on Windows (ECONNREFUSED on SRV)
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer necessary in Mongoose 6+, but keeping them here for standard practice in older versions, they will be ignored in newer ones safely.
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
