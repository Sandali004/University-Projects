import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, enum: ["Car", "Van", "Bus"], required: true },
  vehicleNumber: { type: String, required: true, unique: true },
  seatCount: { type: Number, required: true },
  route: { type: String, required: true }
}, { timestamps: true });

const Driver = mongoose.model("Driver", driverSchema);

export default Driver;
