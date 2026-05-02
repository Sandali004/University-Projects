import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, default: Date.now },
  pickup: { type: Boolean, default: false },
  drop_off: { type: Boolean, default: false }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure uniqueness of student_id and date
attendanceSchema.index({ student_id: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
