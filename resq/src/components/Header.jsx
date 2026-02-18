import { useState } from 'react';

const Header = ({ onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1>R-E-S-Q Dashboard</h1>
      </div>

      {/* --- NEW NAVBAR SECTION --- */}
      <nav className="header-nav">
        <ul className="nav-list">
          <li className="nav-item active">Overview</li>
          <li className="nav-item">Incident Map</li>
          <li className="nav-item">Camera Feed</li>
          <li className="nav-item">Reports</li>
        </ul>
      </nav>
      {/* ------------------------- */}

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
