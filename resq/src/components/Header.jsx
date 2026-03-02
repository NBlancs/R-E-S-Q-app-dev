import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Header = ({ onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1>R-E-S-Q Dashboard</h1>
      </div>

      <nav className="header-nav">
        <ul className="nav-list">
          <li>
            <NavLink 
              to="/overview" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              Overview
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/incident-map" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              Incident Map
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/camera-feed" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              Camera Feed
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/camera-list" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              Camera List
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              Reports
            </NavLink>
          </li>
        </ul>
      </nav>

      <div
        className="user-profile"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span>Admin</span>
        <span className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`}>
          ▼
        </span>

        {showDropdown && (
          <div className="dropdown-menu">
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
