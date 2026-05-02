import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  system_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportationSystem' },
  message: { type: String, required: true },
  type: { type: String }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

notificationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
