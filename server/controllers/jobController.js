const Job = require('../models/Job');
const ErrorResponse = require('../utils/errorResponse');

// Create a new job
exports.createJob = async (req, res, next) => {
  try {
    const { title, description, company, location, employmentType, salaryMin, salaryMax, skills } = req.body;

    if (!title || !description) {
      return next(new ErrorResponse('Title and description are required', 400));
    }

    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      company: company?.trim(),
      location: location?.trim(),
      employmentType: employmentType || 'other',
      salaryMin,
      salaryMax,
      skills: Array.isArray(skills) ? skills : [],
      postedBy: req.user._id
    });

    const populated = await job.populate('postedBy', 'firstName lastName photo role');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// Get my jobs
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
};

// Get all active jobs
exports.getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
};

// Deactivate a job (owner only)
exports.deactivateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return next(new ErrorResponse('Job not found', 404));
    if (String(job.postedBy) !== String(req.user._id)) {
      return next(new ErrorResponse('Not authorized to modify this job', 403));
    }
    job.isActive = false;
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};
