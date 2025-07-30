import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiSettings, FiLogOut, FiMoon, FiUser } from 'react-icons/fi';
import assets from '../assets/assets.js';

function Profile() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);

  const user = state?.user || {
    name: "John Doe",
    role: "Promoter",
    bio: "Creative promoter with a passion for content creation.",
    skills: ["Photography", "Marketing"],
    photo: "https://via.placeholder.com/150",
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You can add logic to persist dark mode preference
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Top Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md p-4`}>
        <div className="container mx-auto flex items-center justify-between">
          {/* Profile Info - Clickable */}
          <div 
            className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/biography', { state: { user } })}
          >
            <img 
              src={user.photo} 
              alt="Profile" 
              className="w-12 h-12 rounded-full border-2 border-teal-400"
            />
            <div>
              <h2 className="font-bold text-lg hover:underline">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className={`relative ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full`}>
              <input
                type="text"
                placeholder="Search..."
                className={`w-full py-2 pl-4 pr-10 rounded-full focus:outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
              />
              <FiSearch className="absolute right-3 top-2.5 text-gray-500" />
            </div>
          </div>

          {/* Settings Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-2 rounded-full hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700' : ''}`}
            >
              <FiSettings className="text-xl" />
            </button>
            
            {isDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900">
                  <FiUser className="mr-2" />
                  Update Profile
                </button>
                <button 
                  onClick={toggleDarkMode}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900"
                >
                  <FiMoon className="mr-2" />
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className="text-3xl font-bold mb-6">Profile Information</h1>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Bio</h3>
              <p className="text-gray-600">{user.bio}</p>
            </div>
            <div>
              <h3 className="font-semibold">Skills</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;