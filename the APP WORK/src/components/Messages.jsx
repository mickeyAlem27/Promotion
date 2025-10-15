import React, { useState, useEffect, useContext, useMemo } from 'react';
import { FiSend, FiBell, FiBellOff } from 'react-icons/fi';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';

const Messages = () => {
  const { socket, isConnected, isUserOnline } = useContext(SocketContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Load current user data and users
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        // Load current user and users data in parallel
        const [userResponse, usersResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/users')
        ]);

        // Handle user data
        if (userResponse.data.success) {
          setCurrentUser(userResponse.data.user);
        } else {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

        // Handle users data (server returns array directly)
        if (Array.isArray(usersResponse.data)) {
          setUsers(usersResponse.data);
        } else {
          setError('Failed to load users');
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          setError('Failed to load application data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Update user online status with optimized timing and connection check
  useEffect(() => {
    if (socket && currentUser && currentUser._id && socket.connected) {
      // Send initial online status
      socket.emit('user_online', { userId: currentUser._id });

      // Set up heartbeat with longer interval for better performance
      const interval = setInterval(() => {
        if (socket && socket.connected && currentUser && currentUser._id) {
          socket.emit('user_online', { userId: currentUser._id });
        }
      }, 60000); // Increased from 30s to 60s for better performance

      return () => clearInterval(interval);
    }
  }, [socket, currentUser]);

  // Listen for user status updates with error handling
  useEffect(() => {
    if (!socket) return;

    const handleUserStatusUpdate = (data) => {
      try {
        if (data.userId && data.online !== undefined) {
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user._id === data.userId
                ? { ...user, online: data.online }
                : user
            )
          );
        }
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    };

    socket.on('user_status_update', handleUserStatusUpdate);

    return () => {
      if (socket) {
        socket.off('user_status_update', handleUserStatusUpdate);
      }
    };
  }, [socket, currentUser]);

  // Filter users based on search term and real-time online status (memoized for performance)
  // Exclude current user from the list since users can't message themselves
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users.filter(user => user._id !== currentUser?._id);
    }
    const searchLower = searchTerm.toLowerCase();
    return users.filter(user =>
      user._id !== currentUser?._id &&
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm, currentUser]);

  // Separate online and offline users based on real-time status
  const onlineUsers = useMemo(() =>
    filteredUsers.filter(user => isUserOnline(user._id)),
    [filteredUsers, isUserOnline]
  );

  const offlineUsers = useMemo(() =>
    filteredUsers.filter(user => !isUserOnline(user._id)),
    [filteredUsers, isUserOnline]
  );

  // Handle conversation selection
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setError('');
    setMessages([]);
    setShowUserProfile(true);

    try {
      const conversationId = [currentUser._id, user._id].sort().join('_');
      setUnreadCounts(prev => {
        const newCounts = new Map(prev);
        newCounts.delete(conversationId);
        return newCounts;
      });

      // Join conversation room
      if (socket && isConnected) {
        socket.emit('join_conversation', conversationId);
      }
    } catch (error) {
      console.error('Error in handleUserSelect:', error);
      showNotificationToast('Error selecting user', 'error');
    }
  };

  // Handle closing user profile
  const handleCloseProfile = () => {
    setShowUserProfile(false);
  };

  // Handle back to user list (mobile)
  const handleBackToUsers = () => {
    setSelectedUser(null);
    setShowUserProfile(false);
    setMessages([]);
  };

  // Real-time message handling
  useEffect(() => {
    if (!selectedUser || !currentUser || !socket) return;

    const conversationId = [currentUser._id, selectedUser._id].sort().join('_');

    const joinConversation = () => {
      if (socket && socket.connected) {
        socket.emit('join_conversation', conversationId);
      }
    };

    joinConversation();

    const handleNewMessage = (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);

        if (document.hidden && notificationsEnabled && message.senderId !== currentUser._id) {
          const senderName = message.sender?.firstName && message.sender?.lastName
            ? `${message.sender.firstName} ${message.sender.lastName}`
            : 'Someone';
          showBrowserNotification(
            `New message from ${senderName}`,
            message.content,
            message.sender?.photo ? `http://localhost:5000${message.sender.photo}` : null
          );
        }

        if (message.senderId !== currentUser._id) {
          setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            const currentCount = newCounts.get(conversationId) || 0;
            newCounts.set(conversationId, currentCount + 1);
            return newCounts;
          });
        }
      }
    };

    const handleLoadMessages = (data) => {
      if (data.conversationId === conversationId && data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('load_messages', handleLoadMessages);

    return () => {
      if (socket && socket.connected) {
        socket.emit('leave_conversation', conversationId);
      }
      socket.off('new_message', handleNewMessage);
      socket.off('load_messages', handleLoadMessages);
    };
  }, [selectedUser, currentUser, socket, notificationsEnabled]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedUser || !socket || !isConnected) {
      return;
    }

    // Ensure current user is loaded before sending message
    if (!currentUser || !currentUser._id) {
      showNotificationToast('User data not loaded yet', 'error');
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

    setIsSending(true);

    try {
      socket.emit('send_message', messageData);

      showNotificationToast('Message sent successfully!', 'success');
      setMessageInput('');

    } catch (error) {
      console.error('Error sending message:', error);
      showNotificationToast('Failed to send message', 'error');
    } finally {
      setTimeout(() => setIsSending(false), 500);
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

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  };

  // Browser notification function
  const showBrowserNotification = (title, body, icon) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    }
  };

  // Get avatar URL with proper photo handling
  const getAvatarUrl = (user, size = 40) => {
    if (!user) return '';

    // Handle current user with proper fallbacks
    if (user._id === currentUser?._id) {
      // Use actual user photo if available, fallback to avatar generator
      if (user.photo) {
        return `http://localhost:5000${user.photo}`;
      }
    } else {
      // For other users, use actual photo if available
      if (user.photo) {
        return `http://localhost:5000${user.photo}`;
      }
    }

    // Generate avatar from name if no photo available
    const encodedName = encodeURIComponent(`${user.firstName || 'Unknown'} ${user.lastName || 'User'}`);
    if (size) {
      return `https://ui-avatars.com/api/?name=${encodedName}&background=1f2937&color=fff&size=${size}`;
    }
    return `https://ui-avatars.com/api/?name=${encodedName}&background=1f2937&color=fff`;
  };

  // Get proper role display name
  const getRoleDisplayName = (role) => {
    if (!role) return 'User';

    const roleMap = {
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'premium': 'Premium User',
      'user': 'User',
      'member': 'Member',
      'guest': 'Guest'
    };

    return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Render error state
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

  // Render loading state
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
              <button
                onClick={() => {
                  if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        showNotificationToast('Notifications enabled!', 'success');
                      } else {
                        showNotificationToast('Notifications denied', 'error');
                      }
                    });
                  }
                }}
                className={`p-2 rounded-full transition-colors ${
                  notificationsEnabled ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-500'
                }`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                {notificationsEnabled ? <FiBell size={20} /> : <FiBellOff size={20} />}
              </button>
              <button
                onClick={() => {
                  const loadUnreadCounts = async () => {
                    // Prevent API call if current user is not loaded
                    if (!currentUser || !currentUser._id) {
                      showNotificationToast('User data not loaded yet', 'error');
                      return;
                    }

                    try {
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 5000);

                      const response = await api.get(`/messages/unread-counts/${currentUser._id}`, {
                        signal: controller.signal
                      });

                      clearTimeout(timeoutId);

                      if (response.data.success) {
                        setUnreadCounts(new Map(Object.entries(response.data.data)));
                        showNotificationToast('Unread counts refreshed!', 'success');
                      }
                    } catch (error) {
                      if (error.name === 'AbortError') {
                        showNotificationToast('Refresh request timed out', 'error');
                      } else {
                        showNotificationToast('Failed to refresh unread counts', 'error');
                      }
                    }
                  };
                  loadUnreadCounts();
                }}
                className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                title="Refresh unread counts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
              {!currentUser && (
                <span className="text-xs text-yellow-400 animate-pulse">
                  Loading...
                </span>
              )}
            </div>
          </div>

          {/* Current User Profile - Enhanced with better data handling */}
          {currentUser && (
            <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="relative">
                <img
                  src={getAvatarUrl(currentUser, 48)}
                  alt={`${currentUser.firstName} ${currentUser.lastName}`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                  onError={(e) => {
                    // Fallback to generated avatar if photo fails
                    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${currentUser.firstName} ${currentUser.lastName}`)}&background=1f2937&color=fff&size=48`;
                    e.target.src = fallbackUrl;
                  }}
                />
                {/* Current user online indicator */}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 bg-green-500 animate-pulse shadow-green-500/50 shadow-lg`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {currentUser.firstName || 'Unknown'} {currentUser.lastName || 'User'} (You)
                </p>
                <p className="text-sm text-gray-300 truncate">
                  {getRoleDisplayName(currentUser.role) || 'User'}
                </p>
                <p className="text-xs text-green-400 truncate">
                  Online • {isConnected ? 'Live' : 'Offline'}
                </p>
              </div>
            </div>
          )}

          {/* Loading state for current user */}
          {!currentUser && !error && (
            <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          )}

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
        <div className="flex-1 overflow-y-auto relative">
          {(() => {
            return (
              <>
                {/* Loading overlay for user list */}
                {(!currentUser || !currentUser._id) && (
                  <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-300">Loading user data...</p>
                    </div>
                  </div>
                )}

                {/* Online Users */}
                {onlineUsers.length > 0 && (
                  <div className="p-3">
                    <div className="text-xs font-semibold text-green-400 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Online ({onlineUsers.length})
                    </div>
                    <div className="space-y-1">
                      {onlineUsers.map((user) => (
                        <div
                          key={user._id}
                          className={`p-3 hover:bg-gray-800/50 cursor-pointer flex items-center space-x-3 transition-colors ${selectedUser?._id === user._id ? 'bg-gray-800/70' : ''} ${!currentUser || !currentUser._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => (!currentUser || !currentUser._id) ? null : handleUserSelect(user)}
                          title={!currentUser || !currentUser._id ? 'Loading user data...' : `Chat with ${user.firstName} ${user.lastName}`}
                        >
                          <div className="relative">
                            <img
                              src={getAvatarUrl(user)}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                              onError={(e) => {
                                e.target.src = getAvatarUrl(user);
                              }}
                            />
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 bg-green-500 animate-pulse shadow-green-500/50 shadow-lg`}></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-white truncate text-sm">
                                {user.firstName} {user.lastName}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold bg-green-500/30 text-green-300 border border-green-400/50 animate-pulse`}>
                                🟢 Online
                              </span>
                              {(() => {
                                const conversationId = [currentUser?._id, user._id].sort().join('_');
                                const unreadCount = unreadCounts.get(conversationId) || 0;
                                return unreadCount > 0 ? (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-medium">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-xs text-gray-300 truncate">{getRoleDisplayName(user.role)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Users */}
                {offlineUsers.length > 0 && (
                  <div className="p-3">
                    <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                      Offline ({offlineUsers.length})
                    </div>
                    <div className="space-y-1">
                      {offlineUsers.map((user) => (
                        <div
                          key={user._id}
                          className={`p-3 hover:bg-gray-800/50 cursor-pointer flex items-center space-x-3 transition-colors ${selectedUser?._id === user._id ? 'bg-gray-800/70' : ''} ${!currentUser || !currentUser._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => (!currentUser || !currentUser._id) ? null : handleUserSelect(user)}
                          title={!currentUser || !currentUser._id ? 'Loading user data...' : `Chat with ${user.firstName} ${user.lastName}`}
                        >
                          <div className="relative">
                            <img
                              src={getAvatarUrl(user)}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                              onError={(e) => {
                                e.target.src = getAvatarUrl(user);
                              }}
                            />
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 bg-gray-500`}></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-white truncate text-sm">
                                {user.firstName} {user.lastName}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold bg-gray-500/30 text-gray-400`}>
                                ⚫ Offline
                              </span>
                              {(() => {
                                const conversationId = [currentUser?._id, user._id].sort().join('_');
                                const unreadCount = unreadCounts.get(conversationId) || 0;
                                return unreadCount > 0 ? (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-medium">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-xs text-gray-300 truncate">{getRoleDisplayName(user.role)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No users message */}
                {onlineUsers.length === 0 && offlineUsers.length === 0 && (
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
              </>
            );
          })()}
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
                  <p className="text-xs text-gray-400">{getRoleDisplayName(selectedUser.role)}</p>
                </div>
              </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4">
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg, index) => {
                      // Determine if message is from current user or other user
                      const isFromCurrentUser = msg.senderId === currentUser?._id;
                      const sender = users.find(user => user._id === msg.senderId);

                      return (
                        <div
                          key={index}
                          className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex items-end space-x-2 max-w-xs">
                            {!isFromCurrentUser && (
                              <img
                                src={getAvatarUrl(sender)}
                                alt={sender ? `${sender.firstName} ${sender.lastName}` : 'User'}
                                className="w-6 h-6 rounded-full object-cover border border-gray-600"
                                onError={(e) => {
                                  e.target.src = getAvatarUrl(sender);
                                }}
                              />
                            )}
                            <div
                              className={`p-3 rounded-lg ${isFromCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
                            >
                              {!isFromCurrentUser && (
                                <p className="text-xs text-gray-300 mb-1">
                                  {sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown User'}
                                </p>
                              )}
                              <p className="text-sm break-words">{msg.content}</p>
                              <p className={`text-xs mt-1 opacity-70 ${isFromCurrentUser ? 'text-blue-200' : 'text-gray-300'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {isFromCurrentUser && (
                              <img
                                src={getAvatarUrl(currentUser)}
                                alt={`${currentUser?.firstName} ${currentUser?.lastName}`}
                                className="w-6 h-6 rounded-full object-cover border-2 border-blue-500"
                                onError={(e) => {
                                  e.target.src = getAvatarUrl(currentUser);
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                  disabled={!isConnected || isSending || !currentUser || !currentUser._id}
                />
                <button
                  type="submit"
                  className={`p-2 rounded-full transition-all duration-200 ${
                    messageInput.trim() && isConnected && !isSending && currentUser && currentUser._id
                      ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-110'
                      : isSending
                      ? 'bg-yellow-500 text-white animate-pulse'
                      : !currentUser || !currentUser._id
                      ? 'bg-gray-500 text-gray-300'
                      : 'bg-gray-600 text-gray-400'
                  }`}
                  disabled={!messageInput.trim() || !isConnected || isSending || !currentUser || !currentUser._id}
                  title={
                    !isConnected
                      ? 'Socket.IO not connected'
                      : isSending
                      ? 'Sending message...'
                      : !currentUser || !currentUser._id
                      ? 'User data not loaded yet'
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
                <div className="w-full max-w-md mx-auto rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center h-48">
                  <div className="text-6xl animate-pulse">💬</div>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${isConnected ? 'bg-green-500/20 animate-pulse' : 'bg-red-500/20'}`}>
                <div className={`text-2xl ${isConnected ? 'text-green-400' : 'text-red-400'}`}>💬</div>
              </div>
              <h2 className="text-xl font-medium mb-2">
                {isConnected ? 'Messaging Active' : 'Connection Required'}
              </h2>
              <p className="text-gray-400 mb-4">
                {isConnected
                  ? 'Real-time messaging is working perfectly'
                  : 'Please check your internet connection and server status'
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

            {/* User Profile Content */}
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
                <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-gray-800 ${isUserOnline(selectedUser._id) ? 'bg-green-500 animate-pulse shadow-green-500/50 shadow-lg' : 'bg-gray-500'}`}></span>
              </div>

              {/* User Info */}
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold transition-all duration-300 ${isUserOnline(selectedUser._id) ? 'bg-green-500/30 text-green-300 border border-green-400/50 animate-pulse' : 'bg-gray-500/30 text-gray-400'}`}>
                      {isUserOnline(selectedUser._id) ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  </div>
                </div>

                {/* Role */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Role</p>
                    <p className="text-white font-medium">{getRoleDisplayName(selectedUser.role)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
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
