import mongoose from "mongoose";

// Describe strictly what data a Parent requires
const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  childName: { type: String, required: true },
  schoolName: { type: String, required: true },
  pickupAddress: { type: String, required: true },
  dropoffAddress: { type: String, required: true },
  role: { type: String, default: 'Parent' } // Explicitly declare as Parent natively
}, { timestamps: true });

const Parent = mongoose.model("Parent", parentSchema);
export default Parent;
