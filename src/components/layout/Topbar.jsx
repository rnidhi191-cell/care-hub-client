import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { Bell, LogOut } from 'lucide-react';
import api from '../../api';

export default function Topbar({ user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // The notification tray should never interrupt normal navigation.
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const openNotification = (notification) => {
    // Reading is explicit; navigation must retain the notification unchanged.
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* Keep the tray usable if the request cannot be completed. */ }
  };

  if (!user) return null;

  return (
    <header className="topbar">
      <div className="topbar__context">
        <span className="topbar__product">
          CARE Hub Enterprise
        </span>
        <span className="topbar__divider">/</span>
        <span className="topbar__subtitle">Performance &amp; Growth</span>
      </div>

      <div className="topbar__actions">
        {/* Notification Bell */}
        <div className="notification-tray">
          <button
            type="button"
            className="topbar__notification"
            title="Notifications"
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={isOpen}
            onClick={() => { setIsOpen((open) => !open); if (!isOpen) loadNotifications(); }}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="topbar__notification-dot" />}
          </button>
          {isOpen && <section className="notification-popover" aria-label="Notifications">
            <div className="notification-popover__header"><strong>Notifications</strong>{unreadCount > 0 && <button type="button" onClick={markAllRead}>Mark all read</button>}</div>
            {notifications.length === 0 ? <p className="notification-popover__empty">You’re all caught up.</p> : <div className="notification-popover__list">{notifications.map((notification) => <button type="button" key={notification._id} className={`notification-item ${notification.readAt ? '' : 'notification-item--unread'}`} onClick={() => openNotification(notification)}><span className="notification-item__title">{notification.title}</span><span>{notification.message}</span><time>{new Date(notification.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</time></button>)}</div>}
          </section>}
        </div>

        {/* User Identity Chip */}
        <div className="topbar__identity">
          <div className="topbar__avatar">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="topbar__identity-text">
            <div className="topbar__name">
              {user.name}
            </div>
            <div className="topbar__role">
              {user.role}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="topbar__logout"
          title="Sign out of CARE Hub"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
