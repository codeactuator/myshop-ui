import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SideNavbar.css';

const SideNavbar = ({ isCollapsed, setIsCollapsed, toggleCollapse, onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleItemClick = () => {
    // Only collapse the navbar automatically on mobile views (width <= 768px)
    if (window.innerWidth <= 768) {
      if (typeof setIsCollapsed === 'function') {
        setIsCollapsed(true);
      } else if (typeof toggleCollapse === 'function') {
        toggleCollapse(true);
      } else if (typeof onClose === 'function') {
        onClose();
      } else {
        // Fallback: Programmatically click the toggle buttons in the layout
        const toggleBtn = document.querySelector('.menu-toggle-btn') || document.querySelector('.sidebar-mobile-toggle');
        if (toggleBtn) {
          toggleBtn.click();
        }
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/products');
    handleItemClick();
  };

  const initialLetter = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : currentUser?.phone
    ? currentUser.phone.charAt(0)
    : '?';

  return (
    <aside className={`side-navbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div>
        {currentUser && (
          <div 
            className="user-profile-section"
            style={isCollapsed ? { display: 'flex', justifyContent: 'center', padding: '15px 0' } : {}}
          >
            <div className="user-avatar" style={isCollapsed ? { display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0 } : {}}>
              <span>{initialLetter}</span>
            </div>
            <div className="user-details" style={isCollapsed ? { display: 'none' } : {}}>
              <span className="user-name">{currentUser.name}</span>
            </div>
          </div>
        )}
        <nav>
          <ul>
            <li>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}>
                <i className="fas fa-store"></i>
                <span>All Products</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/my-orders" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}>
                <i className="fas fa-box-open"></i>
                <span>My Orders</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}>
                <i className="fas fa-user-circle"></i>
                <span>Profile</span>
              </NavLink>
            </li>
            {currentUser?.userType?.toLowerCase() === 'seller' && (
              <>
                <li><NavLink to="/seller/dashboard" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}><i className="fas fa-tachometer-alt"></i><span>Seller Dashboard</span></NavLink></li>
                <li><NavLink to="/seller/inventory" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}><i className="fas fa-boxes"></i><span>My Inventory</span></NavLink></li>
                <li><NavLink to="/seller/shop-config" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}><i className="fas fa-store-alt"></i><span>Shop Configuration</span></NavLink></li>
              </>
            )}
            {currentUser?.userType?.toLowerCase() === 'delivery_partner' && (
              <li>
                <NavLink to="/delivery/dashboard" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}>
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Dashboard</span>
                </NavLink>
              </li>
            )}
            {currentUser?.userType?.toLowerCase() === 'admin' && (
              <>
                <li>
                  <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'active-link' : '')} onClick={handleItemClick}>
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