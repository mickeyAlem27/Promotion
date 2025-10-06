import React, { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiDollarSign, FiUsers, FiSearch, FiFilter, FiBriefcase, FiPlus, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../services/api';

const Jobs = () => {
  const { isAuthenticated, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    employmentType: 'full-time',
    salaryMin: '',
    salaryMax: '',
    skills: []
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsAPI.getJobs();
      setJobs(response.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      setPostingJob(true);
      await jobsAPI.createJob({
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        company: jobForm.company.trim(),
        location: jobForm.location.trim(),
        employmentType: jobForm.employmentType,
        salaryMin: jobForm.salaryMin ? parseInt(jobForm.salaryMin) : null,
        salaryMax: jobForm.salaryMax ? parseInt(jobForm.salaryMax) : null,
        skills: jobForm.skills.filter(skill => skill.trim() !== '')
      });

      setShowPostJobModal(false);
      setJobForm({
        title: '',
        description: '',
        company: '',
        location: '',
        employmentType: 'full-time',
        salaryMin: '',
        salaryMax: '',
        skills: []
      });
      fetchJobs(); // Refresh the jobs list
    } catch (err) {
      console.error('Error posting job:', err);
      setError('Failed to post job. Please try again.');
    } finally {
      setPostingJob(false);
    }
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setJobForm(prev => ({ ...prev, skills }));
  };

  const isPromoterOrBrand = user?.role === 'promoter' || user?.role === 'brand';

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || job.employmentType === filterType;

    return matchesSearch && matchesType;
  });

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max.toLocaleString()}`;
  };

  const getEmploymentTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      'part-time': 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
      'contract': 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
      'internship': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
      'temporary': 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    };
    return colors[type] || colors.other;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <FiBriefcase size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">Please Sign In</h2>
          <p className="text-gray-400">You need to be logged in to view job opportunities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Job Opportunities</h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Discover exciting opportunities posted by promoters and brands in the promotion industry
            </p>
            {isPromoterOrBrand && (
              <button
                onClick={() => setShowPostJobModal(true)}
                className="mt-6 inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <FiPlus />
                Post a Job
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, companies, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiFilter />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All Types
                </button>
                {['full-time', 'part-time', 'contract', 'internship', 'temporary'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <FiBriefcase size={64} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-medium mb-2">No jobs found</h3>
                <p className="text-gray-400">
                  {searchTerm || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : isPromoterOrBrand
                      ? 'No job opportunities available yet. Be the first to post one!'
                      : 'No job opportunities available at the moment'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <div key={job._id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors border border-gray-700">
                    {/* Job Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{job.title}</h3>
                        {job.company && (
                          <p className="text-blue-400 font-medium">{job.company}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(job.employmentType)}`}>
                        {job.employmentType?.replace('-', ' ') || 'Other'}
                      </span>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-3 mb-4">
                      {job.location && (
                        <div className="flex items-center text-gray-300">
                          <FiMapPin className="mr-2 text-gray-400" />
                          <span className="text-sm">{job.location}</span>
                        </div>
                      )}

                      <div className="flex items-center text-gray-300">
                        <FiDollarSign className="mr-2 text-gray-400" />
                        <span className="text-sm">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                      </div>

                      <div className="flex items-center text-gray-300">
                        <FiClock className="mr-2 text-gray-400" />
                        <span className="text-sm">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>

                      {job.skills && job.skills.length > 0 && (
                        <div className="flex items-start text-gray-300">
                          <FiUsers className="mr-2 mt-0.5 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="text-xs text-gray-400">+{job.skills.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description Preview */}
                    {job.description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {job.description}
                      </p>
                    )}

                    {/* Promoter Info */}
                    {job.postedBy && (
                      <div className="border-t border-gray-700 pt-4 mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {job.postedBy.firstName?.charAt(0)}{job.postedBy.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Posted by {job.postedBy.firstName} {job.postedBy.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{job.postedBy.role}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Apply Button */}
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105">
                      View Details & Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        {!loading && !error && (
          <div className="mt-12 text-center">
            <p className="text-gray-400">
              Showing {filteredJobs.length} of {jobs.length} job opportunities
            </p>
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showPostJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Post a Job</h2>
                <button
                  onClick={() => setShowPostJobModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Social Media Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                  <input
                    type="text"
                    value={jobForm.company}
                    onChange={(e) => setJobForm(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={jobForm.location}
                      onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Employment Type</label>
                    <select
                      value={jobForm.employmentType}
                      onChange={(e) => setJobForm(prev => ({ ...prev, employmentType: e.target.value }))}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="temporary">Temporary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Salary ($)</label>
                    <input
                      type="number"
                      value={jobForm.salaryMin}
                      onChange={(e) => setJobForm(prev => ({ ...prev, salaryMin: e.target.value }))}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Salary ($)</label>
                    <input
                      type="number"
                      value={jobForm.salaryMax}
                      onChange={(e) => setJobForm(prev => ({ ...prev, salaryMax: e.target.value }))}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="80000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skills Required (comma-separated)</label>
                  <input
                    type="text"
                    value={jobForm.skills.join(', ')}
                    onChange={handleSkillsChange}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Social Media, Marketing, Photoshop, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={jobForm.description}
                    onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the job responsibilities, requirements, and what you're looking for..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPostJobModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={postingJob}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                  >
                    {postingJob ? 'Posting...' : 'Post Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
