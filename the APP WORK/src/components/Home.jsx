import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiMessageSquare, FiShare2, FiPlus, FiUser, FiSettings, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import assets from '../assets/assets.js';
import CreatePost from './CreatePost';
import { useRef } from 'react';
const mockPosts = [
  {
    id: 1,
    user: { 
      id: "user1", 
      name: "John Doe", 
      role: "Promoter", 
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      bio: "Creative promoter with 5+ years of experience in digital marketing", 
      skills: ["Photography", "Marketing", "Social Media"] 
    },
    content: { 
      type: "photo", 
      url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop&q=60", 
      text: "Check out my latest work for a major fashion brand! #fashion #photography",
      likes: 42,
      comments: 8,
      shares: 5,
      timeAgo: "2h ago"
    },
  },
  {
    id: 2,
    user: { 
      id: "user2", 
      name: "Jane Smith", 
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      role: "Content Creator", 
      bio: "Video content creator specializing in lifestyle and travel", 
      skills: ["Videography", "Editing", "Storytelling"] 
    },
    content: { 
      type: "video", 
      url: "https://www.w3schools.com/html/mov_bbb.mp4", 
      text: "New travel vlog is up! Check out these amazing destinations 🌍✈️ #travel #vlog",
      likes: 128,
      comments: 24,
      shares: 15,
      timeAgo: "5h ago"
    },
  },
  {
    id: 3,
    user: { 
      id: "user3", 
      name: "Alex Johnson", 
      avatar: "https://randomuser.me/api/portraits/men/67.jpg",
      role: "Event Promoter", 
      bio: "Bringing people together through amazing events", 
      skills: ["Event Planning", "Networking", "Branding"] 
    },
    content: { 
      type: "photo", 
      url: "https://images.unsplash.com/photo-1505373876331-ff89e4fdbfe7?w=800&auto=format&fit=crop&q=60", 
      text: "Last night's event was a huge success! Thanks to everyone who came out. #event #networking",
      likes: 89,
      comments: 12,
      shares: 7,
      timeAgo: "1d ago"
    },
  },
];

const featuredCreators = [
  { id: 4, name: "Sarah Wilson", role: "Influencer", avatar: "https://randomuser.me/api/portraits/women/63.jpg" },
  { id: 5, name: "Mike Chen", role: "Photographer", avatar: "https://randomuser.me/api/portraits/men/75.jpg" },
  { id: 6, name: "Emma Davis", role: "Marketer", avatar: "https://randomuser.me/api/portraits/women/22.jpg" },
  { id: 7, name: "David Kim", role: "Videographer", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
  { id: 8, name: "Lisa Wong", role: "Social Media", avatar: "https://randomuser.me/api/portraits/women/18.jpg" },
  { id: 9, name: "James Wilson", role: "Brand Manager", avatar: "https://randomuser.me/api/portraits/men/29.jpg" },
];

function Home() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState(mockPosts);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const settingsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Toggle dark mode class on document element
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleLogout = async () => {
    try {
      // Call the logout function from AuthContext
      await logout();
      // Navigate to login page after successful logout
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if there's an error
      navigate('/login');
    }
  };
  
  // Set user profile from auth context if available
  useEffect(() => {
    if (user) {
      // Extract user data from the nested response structure
      const userData = user.data || user; // Handle both direct and nested user data
      console.log('Current user data:', userData); // Debug log
      console.log('User first name:', userData.firstName);
      console.log('User last name:', userData.lastName);
      console.log('User object keys:', Object.keys(userData));
      
      setUserProfile({
        ...userData,
        avatar: userData.photo || 'https://randomuser.me/api/portraits/lego/1.jpg',
        bio: userData.bio || 'No bio available',
        skills: userData.skills || [],
        role: userData.role || 'User',
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
        firstName: userData.firstName,
        lastName: userData.lastName
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleProfileClick = (user) => {
    navigate(`/profile/${user.id}`, { state: { user } });
  };

  const handleCreatePost = () => {
    navigate("/create-post");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900">
      {/* Background Video */}
      <video autoPlay loop muted className="fixed inset-0 w-full h-full object-cover z-0">
        <source src={assets.smoke} type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-900/90"></div>
      
      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-50" ref={settingsRef}>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 rounded-full bg-gray-800/80 backdrop-blur-md text-white hover:bg-gray-700/90 transition-colors duration-200 shadow-lg"
          aria-label="Settings"
        >
          <FiSettings className="w-6 h-6" />
        </button>
        
        {/* Dropdown Menu */}
        {isSettingsOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 overflow-hidden">
            <button
              onClick={toggleDarkMode}
              className="w-full px-4 py-3 text-left text-gray-200 hover:bg-gray-700/80 transition-colors duration-200 flex items-center"
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
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div 
                    onClick={() => navigate('/profile')}
                    className="cursor-pointer"
                  >
                    {userProfile?.photo ? (
                      <img 
                        src={userProfile.photo} 
                        alt={`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 hover:border-blue-400 transition-all duration-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors duration-200">
                        <FiUser className="text-2xl text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="inline-block bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-1 capitalize">
                    {userProfile?.role || 'User'}
                  </span>
                  <h2 
                    className="text-xl font-bold text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate('/profile')}
                  >
                    {userProfile?.firstName} {userProfile?.lastName}
                  </h2>
                </div>
              </div>

              </div>
            </div>
          
        )};
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Connect with Top Promoters
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Discover amazing content creators, collaborate on projects, and grow your network in the promotion industry.
          </p>
          <button 
            onClick={handleCreatePost}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <FiPlus className="mr-2" /> Create Post
          </button>
        </div>

        {/* Featured Creators */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Featured Creators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {featuredCreators.map(creator => (
              <div 
                key={creator.id} 
                className="glass p-4 rounded-xl text-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => handleProfileClick(creator)}
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
            {mockPosts.map(post => (
              <div key={post.id} className="glass p-5 rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleProfileClick(post.user)}>
                    <img 
                      src={post.user.avatar} 
                      alt={post.user.name} 
                      className="w-12 h-12 rounded-full border-2 border-teal-400/50"
                    />
                    <div>
                      <h3 className="font-semibold text-white">{post.user.name}</h3>
                      <p className="text-xs text-gray-400">{post.user.role} • {post.content.timeAgo}</p>
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
                  </video>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
                    <FiHeart className="w-5 h-5" />
                    <span>{post.content.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
                    <FiMessageSquare className="w-5 h-5" />
                    <span>{post.content.comments}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
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
                {['#marketing', '#photography', '#videography', '#socialmedia', '#branding', '#influencer', '#contentcreation', '#digitalmarketing'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-800 text-sm rounded-full text-gray-300 hover:bg-gray-700 cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Suggested Connections */}
            <div className="glass p-5 rounded-2xl">
              <h3 className="font-semibold text-white mb-3">Suggested Connections</h3>
              <div className="space-y-4">
                {featuredCreators.slice(0, 4).map(creator => (
                  <div key={creator.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="text-sm font-medium text-white">{creator.name}</h4>
                        <p className="text-xs text-gray-400">{creator.role}</p>
                      </div>
                    </div>
                    <button className="text-xs bg-gradient-to-r from-teal-500 to-blue-600 text-white px-3 py-1 rounded-full hover:opacity-90">
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