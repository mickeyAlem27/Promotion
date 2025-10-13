import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiSearch, FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const Messages = () => {
  const { user: currentUser } = useAuth();
  const { socket, isConnected, isUserOnline } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Utility function for generating avatar URLs
  const getAvatarUrl = (user, size = null) => {
    if (user?.photo) {
      return `http://localhost:5000${user.photo}`;
    }
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const encodedName = encodeURIComponent(name);

    if (size) {
      return `https://ui-avatars.com/api/?name=${encodedName}&background=1f2937&color=fff&size=${size}`;
    }

    return `https://ui-avatars.com/api/?name=${encodedName}&background=1f2937&color=fff`;
  };

  // Utility function for online/offline status styling
  const getOnlineStatusClass = (isOnline, size = 'w-3 h-3') => {
    return `absolute bottom-0 right-0 ${size} rounded-full border-2 border-gray-900 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`;
  };

  // Utility function for online/offline badge styling
  const getOnlineBadgeClass = (isOnline) => {
    return `text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`;
  };

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError('');

        if (!currentUser || !currentUser._id) {
          setError('User not logged in');
          return;
        }

        const response = await api.get('/users');
        const allUsers = response.data || [];

        // Filter out current user
        const filteredUsers = allUsers.filter(user => user._id !== currentUser._id);

        if (filteredUsers.length > 0) {
          const processedUsers = filteredUsers.map(user => ({
            ...user,
            online: isUserOnline(user._id) || false
          }));
          setUsers(processedUsers);
        } else {
          setError('No other users found');
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]); // Remove isUserOnline from dependencies to prevent infinite loop

  // Update user online status when connected users change (separate from initial load)
  useEffect(() => {
    if (users.length > 0 && isConnected) {
      setUsers(prevUsers =>
        prevUsers.map(user => ({
          ...user,
          online: isUserOnline(user._id) || false
        }))
      );
    }
  }, [isUserOnline, isConnected]); // Only depend on isUserOnline and isConnected, not users

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [showUserProfile, setShowUserProfile] = useState(false);

  // Handle conversation selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setError('');
    setMessages([]);
    setShowUserProfile(true);

    // Join conversation room
    if (socket && isConnected) {
      const conversationId = [currentUser._id, user._id].sort().join('_');
      socket.emit('join_conversation', conversationId);
    }
  };

  // Close user profile
  const handleCloseProfile = () => {
    setShowUserProfile(false);
  };

  // Handle back to user list (mobile)
  const handleBackToUsers = () => {
    setSelectedUser(null);
    setShowUserProfile(false);
    setMessages([]);
  };

  // Real-time message handling and conversation management
  useEffect(() => {
    if (!selectedUser || !currentUser || !socket) {
      return;
    }

    const conversationId = [currentUser._id, selectedUser._id].sort().join('_');

    // Auto-join conversation when user is selected
    console.log(`🔄 Joining conversation ${conversationId}`);
    socket.emit('join_conversation', conversationId);

    // Debug: Check if Socket.IO events are being received
    setTimeout(() => {
      console.log('🔍 Debug: Checking Socket.IO event listeners');
      console.log('📡 Socket connected:', !!socket);
      console.log('🔗 Socket ID:', socket?.id);
      console.log('👤 Current user ID:', currentUser?._id);
      console.log('🎯 Conversation ID:', conversationId);
    }, 500);

    const handleNewMessage = (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    };

    // Handle loading existing messages
    const handleLoadMessages = (data) => {
      console.log('📨 FRONTEND: Received load_messages event');
      console.log('📊 Load messages data:', data);

      if (data.conversationId === conversationId) {
        console.log(`📨 Loaded ${data.messages?.length || 0} existing messages`);
        console.log('📋 Messages data:', data.messages);

        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
          console.log('✅ Messages state updated successfully');
        } else {
          console.warn('⚠️ Messages data is not an array or is missing');
        }
      } else {
        console.warn('⚠️ ConversationId mismatch:', data.conversationId, 'vs', conversationId);
      }
    };

    // Set up event listeners with error handling
    socket.on('new_message', handleNewMessage);
    socket.on('load_messages', handleLoadMessages);

    // Add error handler for Socket.IO errors
    const handleSocketError = (error) => {
      console.error('🔌 Socket.IO error:', error);
    };
    socket.on('error', handleSocketError);

    return () => {
      console.log(`🔌 Leaving conversation ${conversationId}`);
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('load_messages', handleLoadMessages);
      socket.off('error', handleSocketError);
    };
  }, [selectedUser, currentUser, socket]);

  // Send message with enhanced feedback and notifications
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedUser || !socket || !isConnected) {
      return;
    }

    const conversationId = [currentUser._id, selectedUser._id].sort().join('_');
    const messageData = {
      conversationId,
      content: messageInput.trim(),
      recipientId: selectedUser._id,
      senderId: currentUser._id,
      timestamp: new Date()
    };

    // Set sending state for UI feedback
    setIsSending(true);

    try {
      // Emit message to server
      socket.emit('send_message', messageData);

      // Show success notification
      showNotificationToast('Message sent successfully!', 'success');

      // Clear input immediately for better UX
      setMessageInput('');

    } catch (error) {
      console.error('Error sending message:', error);
      showNotificationToast('Failed to send message', 'error');
    } finally {
      // Reset sending state after a short delay
      setTimeout(() => {
        setIsSending(false);
      }, 1000);
    }
  };

  // Notification system
  const showNotificationToast = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  };

  // Listen for message confirmation from server
  useEffect(() => {
    if (!socket) return;

    const handleMessageSent = (data) => {
      console.log('✅ Message confirmed by server:', data);
      // Additional confirmation handling if needed
    };

    const handleMessageError = (error) => {
      console.error('❌ Message error:', error);
      showNotificationToast(error.error || 'Failed to send message', 'error');
      setIsSending(false);
    };

    // Set up event listeners with error handling
    socket.on('message_sent', handleMessageSent);
    socket.on('message_error', handleMessageError);

    return () => {
      socket.off('message_sent', handleMessageSent);
      socket.off('message_error', handleMessageError);
    };
  }, [socket]);

  // Render error state if there's an error
  if (error) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium mb-2 text-red-400">Error Loading Messages</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Render loading state or error if no current user
  if (!currentUser || !currentUser._id) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading user data...</p>
          <p className="text-sm text-gray-400 mt-2">If this takes too long, refresh the page</p>
        </div>
      </div>
    );
  }

  // Render loading state while users are loading
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
                notification.type === 'success'
                  ? 'bg-green-600 text-white'
                  : notification.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Left sidebar - User list */}
      <div className={`${selectedUser && showUserProfile ? 'hidden md:block md:w-1/3' : 'w-full md:w-1/3'} border-r border-gray-700 flex flex-col h-full`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Messages</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Current User Profile */}
          <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <img
              src={getAvatarUrl(currentUser)}
              alt={`${currentUser?.firstName} ${currentUser?.lastName}`}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
              onError={(e) => {
                e.target.src = getAvatarUrl(currentUser);
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {currentUser?.firstName} {currentUser?.lastName} (You)
              </p>
              <p className="text-sm text-gray-300 truncate">{currentUser?.role || 'Member'}</p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-gray-700/50 text-white pl-3 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`p-3 hover:bg-gray-800/50 cursor-pointer flex items-center space-x-3 transition-colors ${selectedUser?._id === user._id ? 'bg-gray-800/70' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="relative">
                    <img
                      src={getAvatarUrl(user)}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(user);
                      }}
                    />
                    <span className={getOnlineStatusClass(user.online)}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-white truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <span className={getOnlineBadgeClass(user.online)}>
                        {user.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-lg font-medium mb-1">
                {users.length === 0 ? 'No users available' : 'No users match your search'}
              </p>
              <p className="text-sm text-gray-500">
                {users.length === 0 ? 'Check back later for new users' : 'Try adjusting your search terms'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Middle section - Chat area or Default content */}
      <div className={`${selectedUser && showUserProfile ? 'hidden md:block md:flex-1' : 'hidden md:block md:flex-1'} bg-gray-800/30 flex-col h-full`}>
        {selectedUser && showUserProfile ? (
          <>
            {/* Chat Header - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <img
                  src={getAvatarUrl(selectedUser)}
                  alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium truncate">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-xs text-gray-400">{selectedUser.role}</p>
                </div>
              </div>
            </div>

            {/* Messages Area - Scrollable (takes remaining space) */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4">
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.senderId === currentUser._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${msg.senderId === currentUser._id ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 opacity-70 ${msg.senderId === currentUser._id ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-lg font-medium mb-1">Start a conversation</h3>
                    <p className="text-sm">Send a message to begin chatting</p>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800/30">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.firstName}...`}
                  className="flex-1 bg-gray-700/50 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!isConnected || isSending}
                />
                <button
                  type="submit"
                  className={`p-2 rounded-full transition-all duration-200 ${
                    messageInput.trim() && isConnected && !isSending
                      ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-110'
                      : isSending
                      ? 'bg-yellow-500 text-white animate-pulse'
                      : 'bg-gray-600 text-gray-400'
                  }`}
                  disabled={!messageInput.trim() || !isConnected || isSending}
                  title={
                    !isConnected
                      ? 'Socket.IO not connected'
                      : isSending
                      ? 'Sending message...'
                      : 'Send message'
                  }
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <FiSend size={18} />
                  )}
                </button>
              </form>
              {isSending && (
                <div className="text-xs text-yellow-400 mt-1 text-center">
                  Sending message...
                </div>
              )}
            </div>
          </>
        ) : (
          /* Default state - Show welcome message when no user selected */
          <div className="flex flex-col h-full">
            <div className="flex flex-col items-center justify-center flex-1 text-gray-500 p-4 text-center">
              <div className="mb-6">
                {/* Placeholder for video - animated messaging icon */}
                <div className="w-full max-w-md mx-auto rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center h-48">
                  <div className="text-6xl animate-pulse">💬</div>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <div className={`text-2xl ${isConnected ? 'text-green-400' : 'text-red-400'}`}>💬</div>
              </div>
              <h2 className="text-xl font-medium mb-2">
                {isConnected ? 'Select a user to start messaging' : 'Connection Required'}
              </h2>
              <p className="text-gray-400 mb-4">
                {isConnected
                  ? 'Choose someone from the list to begin your conversation'
                  : 'Please ensure your backend server is running'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right section - User Profile (visible when user selected) */}
      {selectedUser && showUserProfile && (
        <div className="hidden md:block md:w-1/3 border-l border-gray-700 bg-gray-800/50">
          <div className="p-4 h-full flex flex-col">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">User Profile</h2>
              <button
                onClick={handleCloseProfile}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Profile Content - Simplified */}
            <div className="flex-1 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-6">
                <img
                  src={getAvatarUrl(selectedUser, 120)}
                  alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
                  onError={(e) => {
                    e.target.src = getAvatarUrl(selectedUser, 120);
                  }}
                />
                <span className={`absolute bottom-1 right-1 ${getOnlineStatusClass(selectedUser.online, 'w-4 h-4')} border-2 border-gray-800`}></span>
              </div>

              {/* User Info - Simplified */}
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={getOnlineBadgeClass(selectedUser.online)}>
                      {selectedUser.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Only show role in the profile section */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Role</p>
                    <p className="text-white font-medium">{selectedUser.role || 'Member'}</p>
                  </div>
                </div>

                {/* See All Profile Button */}
                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => window.open(`http://localhost:5173/profile/${selectedUser._id}`, '_blank')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    See All Profile
                  </button>
                  <button
                    onClick={() => setShowUserProfile(false)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Back to Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
