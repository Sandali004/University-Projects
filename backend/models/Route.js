import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

routeSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Route = mongoose.model("Route", routeSchema);
export default Route;
