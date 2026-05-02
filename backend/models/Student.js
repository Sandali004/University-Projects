import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  system_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportationSystem' },
  school: { type: String },
  grade: { type: String },
  pickup_location: { type: String },
  dropoff_location: { type: String },
  payment_status: { type: String, default: 'Pending' }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

studentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
