const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createJob,
  getMyJobs,
  getJobs,
  deactivateJob
} = require('../controllers/jobController');

const router = express.Router();

router.use(protect);

// Public list of active jobs (still requires auth for now)
router.get('/', getJobs);

// Current user's jobs
router.get('/me', getMyJobs);

// Create job
router.post('/', createJob);

// Deactivate job
router.patch('/:id/deactivate', deactivateJob);

module.exports = router;
