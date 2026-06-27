import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startNode: { type: String, required: true },
  endNode: { type: String, required: true },
  distanceMeters: { type: Number },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('History', HistorySchema);
