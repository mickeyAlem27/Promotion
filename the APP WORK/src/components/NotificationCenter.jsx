import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck, FiMessageSquare, FiUser, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const NotificationCenter = () => {
  const { user: currentUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <FiMessageSquare className="w-5 h-5" />;
      case 'friend_request':
        return <FiUser className="w-5 h-5" />;
      case 'job_update':
        return <FiBriefcase className="w-5 h-5" />;
      default:
        return <FiBell className="w-5 h-5" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'error':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'message':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'friend_request':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'job_update':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // Load notifications from server
  const loadNotifications = async () => {
    if (socket && isConnected && currentUser) {
      socket.emit('get_notifications');
    }
  };

  // Handle real-time notifications
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewNotification = (notification) => {
      console.log('🔔 New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);

      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Show browser notification if tab is not active
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        const notificationObj = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: 'notification',
          requireInteraction: false
        });

        setTimeout(() => notificationObj.close(), 5000);
      }
    };

    const handleNotificationRead = (data) => {
      console.log('✅ Notification marked as read:', data.notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === data.notificationId
            ? { ...notif, read: true }
            : notif
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationsList = (data) => {
      console.log('📋 Loaded notifications:', data.notifications.length);
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications.filter(n => !n.read).length);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notifications_list', handleNotificationsList);

    // Load initial notifications
    loadNotifications();

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notifications_list', handleNotificationsList);
    };
  }, [socket, currentUser, isConnected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    if (socket && isConnected) {
      socket.emit('mark_notification_read', notificationId);
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    if (socket && isConnected) {
      notifications.filter(n => !n.read).forEach(notification => {
        socket.emit('mark_notification_read', notification.id);
      });
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          isOpen
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
        title="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-900/20' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 ml-2 flex-shrink-0"></div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </p>
                          {notification.sender && (
                            <p className="text-xs text-gray-400">
                              from {notification.sender.firstName} {notification.sender.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <FiBell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Notifications will appear here when you receive them
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={loadNotifications}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                Refresh notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
