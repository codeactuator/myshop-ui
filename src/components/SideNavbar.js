import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SideNavbar.css';

const SideNavbar = ({ isCollapsed }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/products');
  };

  return (
    <aside className={`side-navbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div>
        {currentUser && (
          <div className="user-profile-section">
            <div className="user-avatar">
              <span>{currentUser.name.charAt(0)}</span>
            </div>
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
            </div>
          </div>
        )}
        <nav>
          <ul>
            <li>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                <i className="fas fa-store"></i>
                <span>All Products</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/my-orders" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                <i className="fas fa-box-open"></i>
                <span>My Orders</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                <i className="fas fa-user-circle"></i>
                <span>Profile</span>
              </NavLink>
            </li>
            {currentUser?.userType === 'seller' && (
              <>
                <li><NavLink to="/seller/dashboard" className={({ isActive }) => (isActive ? 'active-link' : '')}><i className="fas fa-tachometer-alt"></i><span>Seller Dashboard</span></NavLink></li>
                <li><NavLink to="/seller/inventory" className={({ isActive }) => (isActive ? 'active-link' : '')}><i className="fas fa-boxes"></i><span>My Inventory</span></NavLink></li>
              </>
            )}
            {currentUser?.userType === 'admin' && (
              <>
                <li>
                  <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                    <i className="fas fa-user-shield"></i>
                    <span>Admin Dashboard</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
      <div className="logout-section">
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default SideNavbar;