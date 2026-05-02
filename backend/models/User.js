import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'driver', 'parent', 'attendant'] 
  },
  phone: { type: String },
  license_number: { type: String }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a virtual 'id' to map '_id' so the frontend doesn't break
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const User = mongoose.model("User", userSchema);
export default User;
