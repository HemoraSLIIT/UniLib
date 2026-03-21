import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchNotifications();
  }, [user, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (notification) => {
      setNotifications((current) => [notification, ...current]);
    };

    socket.on('new-notification', handleNew);
    return () => socket.off('new-notification', handleNew);
  }, [socket]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications();
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
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
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((current) =>
        current.filter((notification) => notification._id !== notificationId)
      );
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const badgeClass = (type) => {
    if (type === 'reminder') return 'bg-[#f7f3ea] text-[#7c5b25]';
    if (type === 'overdue') return 'bg-[#fff1eb] text-[#9a3412]';
    if (type === 'info') return 'bg-[#e8eef5] text-[#163b63]';
    return 'bg-[#f1f5f9] text-[#475569]';
  };

  const formatTime = (dateStr) => (dateStr ? new Date(dateStr).toLocaleString() : '');

  if (loading) {
    return (
      <div className="surface-card-soft p-10 text-center text-[#5f6f81]">
        Loading notifications...
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="page-eyebrow">Inbox</p>
          <h1 className="title-serif mt-3 text-4xl font-semibold text-[#203245]">Notifications</h1>
          <p className="mt-3 max-w-2xl text-[#6b7280]">
            Stay on top of borrow confirmations, returns, reminders, and overdue alerts.
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="button-secondary self-start px-4 py-2 text-sm"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="surface-card-soft border-dashed p-10 text-center text-[#5f6f81]">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={[
                'flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between',
                notification.read
                  ? 'border-[#e4e0d9]'
                  : 'border-[#d7dee6]',
              ].join(' ')}
            >
              <div className="space-y-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase ${badgeClass(notification.type)}`}>
                  {notification.type || 'general'}
                </span>
                <p className="text-base text-[#203245]">{notification.message}</p>
                <p className="text-sm text-[#6b7280]">{formatTime(notification.createdAt)}</p>
              </div>

              <div className="flex items-center gap-2">
                {!notification.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notification._id)}
                    className="button-primary px-4 py-3 text-sm"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notification._id)}
                  className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default NotificationsPage;
