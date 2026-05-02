import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plate_number: { type: String, required: true, unique: true },
  model: { type: String },
  color: { type: String },
  max_seats: { type: Number }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

vehicleSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
