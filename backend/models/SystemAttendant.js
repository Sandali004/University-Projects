import mongoose from "mongoose";

const systemAttendantSchema = new mongoose.Schema({
  system_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportationSystem', required: true },
  attendant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  is_present: { type: Boolean, default: false },
  has_control: { type: Boolean, default: false },
  can_view_activities: { type: Boolean, default: false },
  can_view_payments: { type: Boolean, default: false },
  can_edit_payments: { type: Boolean, default: false }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

systemAttendantSchema.index({ system_id: 1, attendant_id: 1 }, { unique: true });

const SystemAttendant = mongoose.model("SystemAttendant", systemAttendantSchema);
export default SystemAttendant;
