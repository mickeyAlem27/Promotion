import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import assets from '../assets/assets.js';

function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    skills: [],
    bio: "",
    photo: null,
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      skills: value.split(',').map(skill => skill.trim())
    }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Signup:", formData);
    navigate("/home");
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover z-0">
        <source src={assets.smoke} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="glass rounded-2xl p-5 sm:p-6 w-1/2 max-w-xs sm:max-w-sm z-10 shadow-2xl animate-fade-in">
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text mb-1">Create Account</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Step {step} of 3</p>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-6">
          <div
            className="bg-gradient-to-r from-teal-400 to-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="form-group">
                <label className="form-label text-xs sm:text-sm">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input w-full text-sm"
                  placeholder=""
                />
              </div>
              <div className="form-group">
                <label className="form-label text-xs sm:text-sm">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input w-full text-sm"
                  placeholder=""
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label text-xs sm:text-sm">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input w-full text-sm"
                placeholder=""
              />
            </div>
            <div className="form-group">
              <label className="form-label text-xs sm:text-sm">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input w-full text-sm"
                placeholder=""
              />
            </div>
            <div className="form-group">
              <label className="form-label text-xs sm:text-sm">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input w-full text-sm"
                placeholder=""
              />
            </div>
            <div className="pt-2">
              <button
                onClick={handleNext}
                className="w-full gradient-btn hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-300 py-2.5 text-sm"
              >
                Continue
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label text-xs sm:text-sm">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input w-full text-sm"
              >
                <option value="">Select your role</option>
                <option value="promoter">Promoter</option>
                <option value="brand">Brand</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label text-xs sm:text-sm">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills.join(', ')}
                onChange={handleSkillsChange}
                className="form-input w-full text-sm"
                placeholder="e.g., JavaScript, React, UI/UX"
              />
            </div>
            <div className="form-group">
              <label className="form-label text-xs sm:text-sm">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                className="form-input w-full text-sm"
                placeholder="Tell us about yourself..."
              ></textarea>
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="gradient-btn hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-300 py-2 px-6 text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label text-xs sm:text-sm">Profile Photo</label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer">
                  <div className="w-full border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-teal-400 transition-colors">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-xs text-gray-400">
                      {formData.photo ? formData.photo.name : 'Click to upload a photo'}
                    </p>
                    <input
                      type="file"
                      name="photo"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </label>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="gradient-btn hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-300 py-2 px-6 text-sm"
              >
                Complete Signup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;