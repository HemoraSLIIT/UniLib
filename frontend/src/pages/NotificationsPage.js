import React, { useState, useEffect } from 'react';
import { getUserNotifications, markAsRead } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications();
      setNotifications(
        Array.isArray(data) ? data : data.notifications || []
      );
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'reminder': return 'badge-reminder';
      case 'overdue': return 'badge-overdue';
      case 'info': return 'badge-info';
      default: return 'badge-general';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Notifications</h2>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">No notifications yet.</div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-content">
                <span className={`notification-badge ${getBadgeClass(notification.type)}`}>
                  {notification.type || 'general'}
                </span>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {formatTime(notification.createdAt)}
                </span>
              </div>

              {!notification.read && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleMarkAsRead(notification._id)}
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
