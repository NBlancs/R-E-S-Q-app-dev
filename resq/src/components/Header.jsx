import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({
  onLogout,
  alerts = [],
  onMarkAlertRead,
  onMarkAlertUnread,
  onDismissAlert,
  roleLabel = 'Admin',
  userAvatar = '',
  navItems = [],
  canDismissAlerts = true,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const unreadCount = alerts.filter((alert) => !alert.isRead && !alert.isDismissed).length;

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => {
      const nextState = !prev;
      if (nextState) {
        setShowUserDropdown(false);
      }
      return nextState;
    });
  };

  const handleToggleUserDropdown = () => {
    setShowUserDropdown((prev) => {
      const nextState = !prev;
      if (nextState) {
        setShowNotifications(false);
      }
      return nextState;
    });
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1>R-E-S-Q Dashboard</h1>
      </div>

      {navItems.length > 0 && (
        <nav className="header-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="header-actions">
        <div className="notifications-wrapper">
          <button
            type="button"
            className="notification-btn"
            onClick={handleToggleNotifications}
            aria-label="View active alerts"
          >
            <svg
              className="notification-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
                fill="currentColor"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <h3>Active Alerts</h3>

              {alerts.length === 0 ? (
                <p className="no-alerts">No active alerts</p>
              ) : (
                alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className={`notification-item ${alert.priority} ${alert.isDismissed ? 'notification-item--dismissed' : ''} ${!alert.isRead && !alert.isDismissed ? 'notification-item--unread' : ''}`}
                  >
                    <div className="notification-info">
                      <h4>{alert.title}</h4>
                      <p>{alert.location}</p>
                      <span>{alert.time}</span>
                      <span>{(alert.confidence * 100).toFixed(1)}% confidence</span>
                      <span>
                        {alert.isDismissed ? 'Dismissed' : alert.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>
                    <div className="notification-actions">
                      {alert.isRead ? (
                        <button
                          type="button"
                          className="notification-toggle-btn"
                          onClick={() => onMarkAlertUnread(alert.id)}
                        >
                          Mark Unread
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="notification-toggle-btn"
                          onClick={() => onMarkAlertRead(alert.id)}
                        >
                          Mark Read
                        </button>
                      )}

                      {canDismissAlerts && (
                        <button
                          type="button"
                          className="notification-dismiss-btn"
                          onClick={() => onDismissAlert(alert.id)}
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </div>

        <div
          className="user-profile"
          onClick={handleToggleUserDropdown}
        >
          {userAvatar ? (
            <img className="user-avatar" src={userAvatar} alt={`${roleLabel} avatar`} />
          ) : (
            <div className="user-avatar user-avatar-fallback" aria-hidden="true">
              {roleLabel.charAt(0)}
            </div>
          )}
          <span>{roleLabel}</span>
          <span className={`dropdown-icon ${showUserDropdown ? 'rotate' : ''}`}>
            ▼
          </span>

          {showUserDropdown && (
            <div className="dropdown-menu">
              <button
                type="button"
                className="profile-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowUserDropdown(false);
                  navigate('/profile');
                }}
              >
                Update Profile
              </button>
              <button
                className="logout-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowUserDropdown(false);
                  onLogout();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
