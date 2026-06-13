import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminNavbar.css';

/**
 * Top navigation bar specifically for the Admin Dashboard.
 * Includes branding and the primary logout action.
 */
const AdminNavbar = ({ toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Redirect to welcome screen after logout
    navigate('/welcome');
  };

  return (
    <header className="admin-top-navbar">
      <div className="admin-nav-left">
        <button className="sidebar-mobile-toggle" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        <Link to="/admin/dashboard" className="admin-nav-brand">
          hungrynow <span>admin</span>
        </Link>
      </div>
      <div className="admin-nav-right">
        <button onClick={handleLogout} className="admin-logout-action">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;