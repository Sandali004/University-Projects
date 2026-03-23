import mongoose from "mongoose";

// Describe strictly what data an Attendant requires
const attendantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nicNumber: { type: String, required: true, unique: true },
  assignedRoute: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  role: { type: String, default: 'Attendant' } // Explicitly declare as Attendant natively
}, { timestamps: true });

const Attendant = mongoose.model("Attendant", attendantSchema);
export default Attendant;
