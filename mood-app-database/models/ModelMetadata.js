/**
 * ModelMetadata — MoodFlix
 * Track deployed AI model versions and performance metrics
 */
const mongoose = require('mongoose');

const modelMetadataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: String, required: true },
  path: { type: String, required: true },
  status: { type: String, enum: ['training','deployed','deprecated','failed'], default: 'training' },
  isActive: { type: Boolean, default: false },
  metrics: {
    accuracy: Number, macroF1: Number, top2Accuracy: Number,
    inferenceTimeMs: Number, modelSizeMb: Number
  },
  training: {
    datasetSize: Number, epochs: Number, batchSize: Number,
    learningRate: Number, backbone: String, inputSize: Number
  },
  releaseNotes: String,
  deployedAt: { type: Date },
  deprecatedAt: { type: Date }
}, { timestamps: true });

modelMetadataSchema.index({ name: 1, version: 1 }, { unique: true });
modelMetadataSchema.index({ isActive: 1, status: 1 });

modelMetadataSchema.statics.getActiveModel = function(name = 'mood-classifier') {
  return this.findOne({ name, isActive: true, status: 'deployed' }).sort({ createdAt: -1 });
};

modelMetadataSchema.statics.deployVersion = async function(name, version) {
  await this.updateMany({ name, isActive: true }, { isActive: false });
  return this.findOneAndUpdate(
    { name, version },
    { isActive: true, status: 'deployed', deployedAt: new Date() },
    { new: true }
  );
};

module.exports = mongoose.model('ModelMetadata', modelMetadataSchema);
