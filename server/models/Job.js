const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary', 'other'], default: 'other' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    skills: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
