import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export { SocketContext };
export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const socketRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Show browser notification for new messages
  const showBrowserNotification = useCallback((title, body, icon = null) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-message',
        requireInteraction: false,
        silent: false
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (user && token) {
      console.log('🔌 Connecting to Socket.IO...');

      const newSocket = io('http://localhost:5000', {
      });

      socketRef.current = newSocket;

      // Enhanced online status tracking
      const heartbeatInterval = setInterval(() => {
        if (newSocket && newSocket.connected) {
          // Send heartbeat to keep connection alive and update status
          newSocket.emit('user_heartbeat', {
            userId: user?.id || user?._id,
            timestamp: new Date(),
            isActive: true
          });
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Handle connection recovery
      const handleReconnect = () => {
        console.log('🔄 Socket reconnected, updating online status');
        setIsConnected(true);

        // Re-join user's personal room for notifications
        if (user?.id || user?._id) {
          newSocket.emit('rejoin_user_room', { userId: user.id || user._id });
        }

        // Update user status
        if (user?.id || user?._id) {
          newSocket.emit('user_online', {
            userId: user.id || user._id,
            timestamp: new Date(),
            isDemo: false
          });
        }
      };

      const handleDisconnect = () => {
        console.log('🔌 Socket disconnected');
        setIsConnected(false);
      };

      newSocket.on('connect', handleReconnect);
      newSocket.on('disconnect', handleDisconnect);

      // Track connected users
      newSocket.on('user_online', (data) => {
        setConnectedUsers(prev => new Set([...prev, data.userId]));
      });

      newSocket.on('user_offline', (data) => {
        setConnectedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      // Handle real-time notifications
      newSocket.on('new_notification', (notification) => {
        console.log('🔔 New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifications(prev => prev + 1);

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
      });

      newSocket.on('notification_read', (data) => {
        console.log('✅ Notification marked as read:', data.notificationId);
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === data.notificationId
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      });

      newSocket.on('notifications_list', (data) => {
        console.log('📋 Loaded notifications:', data.notifications.length);
        setNotifications(data.notifications || []);
        setUnreadNotifications(data.notifications.filter(n => !n.read).length);
      });

      return () => {
        clearInterval(heartbeatInterval);
        newSocket.off('connect', handleReconnect);
        newSocket.off('disconnect', handleDisconnect);
        newSocket.off('user_online');
        newSocket.off('user_offline');
        newSocket.off('new_notification');
        newSocket.off('notification_read');
        newSocket.off('notifications_list');
        newSocket.close();
      };
    }
  }, [user, token]);

  const value = {
    socket,
    isConnected,
    connectedUsers: Array.from(connectedUsers),
    isUserOnline: useCallback((userId) => connectedUsers.has(userId), [connectedUsers]),
    unreadCounts,
    setUnreadCounts,
    notifications,
    unreadNotifications,
    showBrowserNotification,
    notificationsEnabled
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
