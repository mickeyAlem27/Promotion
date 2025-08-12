import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiSearch, FiChevronLeft, FiUser, FiSend, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Messages = () => {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);

  // Mock users for demonstration
  const mockUsers = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Brand Manager',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Creative professional with 5+ years in digital marketing',
      skills: ['Marketing', 'Strategy', 'Social Media'],
      online: true
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'Content Creator',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      bio: 'Video content specialist & social media influencer',
      skills: ['Video Editing', 'Photography', 'Storytelling'],
      online: true
    },
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'Graphic Designer',
      photo: 'https://randomuser.me/api/portraits/men/22.jpg',
      bio: 'Freelance designer passionate about branding',
      skills: ['UI/UX', 'Branding', 'Illustration'],
      online: false
    }
  ];

  // Fetch users from the backend
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you would fetch users from your API
      // const response = await api.get('/users');
      // const otherUsers = response.data.filter(user => user._id !== currentUser?._id);
      // setUsers(otherUsers);
      
      // For now, use mock data
      setUsers(mockUsers);
      
      // Select first user by default
      if (mockUsers.length > 0) {
        setSelectedUser(mockUsers[0]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Using demo data.');
      setUsers(mockUsers);
      if (mockUsers.length > 0) {
        setSelectedUser(mockUsers[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Set user profile from auth context if available
  useEffect(() => {
    if (currentUser) {
      // Extract user data from the nested response structure
      const userData = currentUser.data || currentUser; // Handle both direct and nested user data
      
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
      
      // Only fetch other users after we've set the current user profile
      fetchUsers();
    }
  }, [currentUser]);

  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const searchLower = searchTerm.toLowerCase();
    return users.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const role = (user.role || '').toLowerCase();
      return fullName.includes(searchLower) || role.includes(searchLower);
    });
  }, [users, searchTerm]);

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;
    
    // In a real app, you would send the message to your API
    console.log(`Sending message to ${selectedUser.firstName}:`, message);
    
    // Clear the input
    setMessage('');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left sidebar - User list */}
      <div className="w-full md:w-1/3 border-r border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Messages</h1>
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded-full md:hidden"
            >
              <FiChevronLeft size={20} />
            </button>
          </div>
          
          {/* Current User Profile */}
          <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <div className="relative">
              <img 
                src={userProfile?.photo || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                alt={userProfile?.name || 'User'}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=1f2937&color=fff`;
                }}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {userProfile?.name || 'User'}
              </p>
              <p className="text-sm text-gray-300 truncate">{userProfile?.role || 'Member'}</p>
            </div>
            <button className="p-2 text-gray-400 hover:text-white">
              <FiMoreVertical />
            </button>
          </div>
          
          {/* Search */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-gray-700/50 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-2">
                  <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-400">
              <p className="mb-2">{error}</p>
              <button 
                onClick={fetchUsers}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <div 
                  key={user._id}
                  className={`p-3 hover:bg-gray-800/50 cursor-pointer flex items-center space-x-3 transition-colors ${
                    selectedUser?._id === user._id ? 'bg-gray-800/70' : ''
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="relative">
                    <img 
                      src={user.photo} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=1f2937&color=fff`;
                      }}
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                      user.online ? 'bg-green-500' : 'bg-gray-500'
                    }`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-300 truncate">{user.role}</p>
                  </div>
                  <FiMessageSquare className="text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-lg font-medium mb-1">
                {searchTerm ? 'No users found' : 'No users available'}
              </p>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try a different search term' : 'Check back later for new connections'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Message thread */}
      <div className="hidden md:flex flex-col flex-1 bg-gray-800/30">
        {selectedUser ? (
          <>
            {/* Current User Info - Mobile */}
            <div className="md:hidden bg-gray-800 p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={userProfile?.photo || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=1f2937&color=fff`;
                      }}
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {userProfile?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400">{userProfile?.role || 'Member'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
                >
                  <FiMessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex justify-center items-center h-full text-gray-500 text-sm">
                Select a conversation to start messaging
              </div>
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.firstName}...`}
                  className="flex-1 bg-gray-700/50 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  className="p-2 text-blue-400 hover:text-blue-300"
                  disabled={!message.trim()}
                >
                  <FiSend size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <FiMessageSquare size={48} className="mb-4 opacity-20" />
            <h2 className="text-xl font-medium mb-2">No conversation selected</h2>
            <p className="max-w-md">
              Select a conversation from the list or search for someone to start chatting.
            </p>
          </div>
        )}
      </div>
      
      {/* Mobile view - Show either list or thread */}
      {selectedUser ? (
        <div className="md:hidden flex-1 flex flex-col bg-gray-800/30">
          <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
            <button 
              onClick={() => setSelectedUser(null)}
              className="p-1 -ml-2"
            >
              <FiChevronLeft size={24} className="text-gray-400" />
            </button>
            <div className="flex-1">
              <h2 className="font-medium">
                {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <p className="text-xs text-gray-400">{selectedUser.role}</p>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-center items-center h-full text-gray-500 text-sm">
              Start a new conversation with {selectedUser.firstName}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Message ${selectedUser.firstName}...`}
                className="flex-1 bg-gray-700/50 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button 
                type="submit"
                className="p-2 text-blue-400 hover:text-blue-300"
                disabled={!message.trim()}
              >
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Messages;
