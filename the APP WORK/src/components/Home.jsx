import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming this is your auth context
import {
  FiSettings,
  FiLogOut,
  FiUser,
  FiPlus,
  FiBriefcase,
  FiHeart,
  FiMessageSquare,
  FiShare2,
  FiSun,
  FiMoon,
} from 'react-icons/fi';

// Mock data (ideally fetched from an API)
const mockPosts = [
  {
    id: 1,
    user: {
      id: 'user1',
      name: 'John Doe',
      role: 'Promoter',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Creative promoter with 5+ years of experience in digital marketing',
      skills: ['Photography', 'Marketing', 'Social Media'],
    },
    content: {
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop&q=60',
      text: 'Check out my latest work for a major fashion brand! #fashion #photography',
      likes: 42,
      comments: 8,
      shares: 5,
      timeAgo: '2h ago',
    },
  },
  {
    id: 2,
    user: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      role: 'Content Creator',
      bio: 'Video content creator specializing in lifestyle and travel',
      skills: ['Videography', 'Editing', 'Storytelling'],
    },
    content: {
      type: 'video',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      text: 'New travel vlog is up! Check out these amazing destinations 🌍✈️ #travel #vlog',
      likes: 128,
      comments: 24,
      shares: 15,
      timeAgo: '5h ago',
    },
  },
  {
    id: 3,
    user: {
      id: 'user3',
      name: 'Alex Johnson',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      role: 'Event Promoter',
      bio: 'Bringing people together through amazing events',
      skills: ['Event Planning', 'Networking', 'Branding'],
    },
    content: {
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1505373876331-ff89e4fdbfe7?w=800&auto=format&fit=crop&q=60',
      text: "Last night's event was a huge success! Thanks to everyone who came out. #event #networking",
      likes: 89,
      comments: 12,
      shares: 7,
      timeAgo: '1d ago',
    },
  },
];

const featuredCreators = [
  { id: 4, name: 'Sarah Wilson', role: 'Influencer', avatar: 'https://randomuser.me/api/portraits/women/63.jpg' },
  { id: 5, name: 'Mike Chen', role: 'Photographer', avatar: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { id: 6, name: 'Emma Davis', role: 'Marketer', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' },
  { id: 7, name: 'David Kim', role: 'Videographer', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { id: 8, name: 'Lisa Wong', role: 'Social Media', avatar: 'https://randomuser.me/api/portraits/women/18.jpg' },
  { id: 9, name: 'James Wilson', role: 'Brand Manager', avatar: 'https://randomuser.me/api/portraits/men/29.jpg' },
];

function Home() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [posts] = useState(mockPosts); // Removed unused setPosts
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize based on system preference or localStorage
    return localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const settingsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set dark mode class and persist preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Set user profile from auth context
  useEffect(() => {
    if (user && isAuthenticated) {
      const userData = user.data || user;
      const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
      setUserProfile({
        id: userData.id || 'unknown',
        avatar: userData.photo || 'https://randomuser.me/api/portraits/lego/1.jpg',
        bio: userData.bio || 'No bio available',
        skills: userData.skills || [],
        role: userData.role || 'User',
        name,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
      });
      setIsLoading(false);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, authLoading]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  const isPromoter = userProfile?.role?.toLowerCase() === 'promoter';
  const isBrand = userProfile?.role?.toLowerCase() === 'brand';
  const canPostJobs = isPromoter;

  const handleCreateJob = () => {
    navigate('/create-job');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900 dark:bg-gray-900">
      {/* Background Video - Replaced with placeholder */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
        poster="https://placehold.co/1920x1080/1f2937/ffffff?text=Background+Video"
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-900/90"></div>

      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-50" ref={settingsRef}>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 rounded-full bg-gray-800/80 backdrop-blur-md text-white hover:bg-gray-700/90 transition-colors duration-200 shadow-lg"
          aria-label="Toggle settings menu"
        >
          <FiSettings className="w-6 h-6" />
        </button>

        {isSettingsOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 overflow-hidden">
            <button
              onClick={toggleDarkMode}
              className="w-full px-4 py-3 text-left text-gray-200 hover:bg-gray-700/80 transition-colors duration-200 flex items-center"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <>
                  <FiSun className="w-5 h-5 mr-3" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <FiMoon className="w-5 h-5 mr-3" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700/80 transition-colors duration-200 flex items-center"
              aria-label="Log out"
            >
              <FiLogOut className="w-5 h-5 mr-3" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* User Profile Section */}
        {userProfile && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
            <div className="flex items-center space-x-4">
              <div
                onClick={() => handleProfileClick(userProfile.id)}
                className="cursor-pointer"
                role="button"
                aria-label={`View ${userProfile.name}'s profile`}
              >
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 hover:border-blue-400 transition-all duration-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors duration-200">
                    <FiUser className="text-2xl text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <span className="inline-block bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-1 capitalize">
                  {userProfile.role}
                </span>
                <h2
                  className="text-xl font-bold text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                  onClick={() => handleProfileClick(userProfile.id)}
                >
                  {userProfile.name}
                </h2>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Connect with Top Promoters
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Discover amazing content creators, collaborate on projects, and grow your network in the promotion industry.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6">
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
              aria-label="Create a new post"
            >
              <FiPlus className="mr-2" /> Create Post
            </button>

            {canPostJobs && (
              <button
                onClick={() => navigate('/create-job')}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                aria-label="Post a new job"
              >
                <FiBriefcase className="mr-2" /> Post Job
              </button>
            )}
          </div>
        </div>

        {/* Featured Creators */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Featured Creators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {featuredCreators.map((creator) => (
              <div
                key={creator.id}
                className="glass p-4 rounded-xl text-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => handleProfileClick(creator.id)}
                role="button"
                aria-label={`View ${creator.name}'s profile`}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-teal-400/50">
                  <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-medium text-white">{creator.name}</h3>
                <p className="text-xs text-gray-400">{creator.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2">Latest Posts</h2>
            {posts.map((post) => (
              <div
                key={post.id}
                className="glass p-5 rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => handleProfileClick(post.user.id)}
                    role="button"
                    aria-label={`View ${post.user.name}'s profile`}
                  >
                    <img
                      src={post.user.avatar}
                      alt={post.user.name}
                      className="w-12 h-12 rounded-full border-2 border-teal-400/50"
                    />
                    <div>
                      <h3 className="font-semibold text-white">{post.user.name}</h3>
                      <p className="text-xs text-gray-400">
                        {post.user.role} • {post.content.timeAgo}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-200 mb-4">{post.content.text}</p>

                {post.content.type === 'photo' ? (
                  <img
                    src={post.content.url}
                    alt="Post content"
                    className="w-full rounded-lg object-cover max-h-96"
                  />
                ) : (
                  <video
                    controls
                    className="w-full rounded-lg max-h-96"
                    poster="https://placehold.co/800x450/1f2937/ffffff?text=Video+Thumbnail"
                  >
                    <source src={post.content.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-white" aria-label={`Like post (${post.content.likes} likes)`}>
                    <FiHeart className="w-5 h-5" />
                    <span>{post.content.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-white" aria-label={`Comment on post (${post.content.comments} comments)`}>
                    <FiMessageSquare className="w-5 h-5" />
                    <span>{post.content.comments}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-white" aria-label={`Share post (${post.content.shares} shares)`}>
                    <FiShare2 className="w-5 h-5" />
                    <span>{post.content.shares}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Tags */}
            <div className="glass p-5 rounded-2xl">
              <h3 className="font-semibold text-white mb-3">Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  '#marketing',
                  '#photography',
                  '#videography',
                  '#socialmedia',
                  '#branding',
                  '#influencer',
                  '#contentcreation',
                  '#digitalmarketing',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-800 text-sm rounded-full text-gray-300 hover:bg-gray-700 cursor-pointer"
                    role="button"
                    aria-label={`Filter by ${tag}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested Connections */}
            <div className="glass p-5 rounded-2xl">
              <h3 className="font-semibold text-white mb-3">Suggested Connections</h3>
              <div className="space-y-4">
                {featuredCreators.slice(0, 4).map((creator) => (
                  <div key={creator.id} className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handleProfileClick(creator.id)}
                      role="button"
                      aria-label={`View ${creator.name}'s profile`}
                    >
                      <img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="text-sm font-medium text-white">{creator.name}</h4>
                        <p className="text-xs text-gray-400">{creator.role}</p>
                      </div>
                    </div>
                    <button
                      className="text-xs bg-gradient-to-r from-teal-500 to-blue-600 text-white px-3 py-1 rounded-full hover:opacity-90"
                      aria-label={`Follow ${creator.name}`}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleCreatePost}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-20"
        aria-label="Create new post"
      >
        <FiPlus className="w-6 h-6" />
      </button>
    </div>
  );
}

export default Home;