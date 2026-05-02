import mongoose from "mongoose";

const systemParentSchema = new mongoose.Schema({
  system_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportationSystem', required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickup_lat: { type: Number },
  pickup_lng: { type: Number }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false }, // only created_at in original schema
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure uniqueness of system_id and parent_id combination
systemParentSchema.index({ system_id: 1, parent_id: 1 }, { unique: true });

const SystemParent = mongoose.model("SystemParent", systemParentSchema);
export default SystemParent;
