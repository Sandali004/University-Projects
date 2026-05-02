import mongoose from "mongoose";

const systemSchema = new mongoose.Schema({
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  plate_number: { type: String, required: true, unique: true },
  vehicle_type: { type: String },
  max_seats: { type: Number },
  join_code: { type: String, required: true, unique: true },
  current_lat: { type: Number },
  current_lng: { type: Number },
  route_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  start_lat: { type: Number },
  start_lng: { type: Number },
  start_location_name: { type: String },
  end_lat: { type: Number },
  end_lng: { type: Number },
  end_location_name: { type: String },
  route_polyline: { type: String }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

systemSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const TransportationSystem = mongoose.model("TransportationSystem", systemSchema);
export default TransportationSystem;
