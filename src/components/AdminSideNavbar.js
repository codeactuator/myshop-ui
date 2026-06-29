import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSideNavbar = ({ isOpen, onClose }) => {
  const handleItemClick = () => {
    // Collapse the sidebar on mobile after clicking a link
    if (onClose && window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <nav>
        <NavLink to="/admin/dashboard" end className={({ isActive }) => isActive ? 'active' : ''} onClick={handleItemClick}>
          <i className="fas fa-chart-line"></i> Dashboard
        </NavLink>
        <NavLink to="/admin/dashboard/users" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleItemClick}>
          <i className="fas fa-users"></i> Users
        </NavLink>
        <NavLink to="/admin/dashboard/orders" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleItemClick}>
          <i className="fas fa-exchange-alt"></i> Orders
        </NavLink>
        <NavLink to="/admin/dashboard/products" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleItemClick}>
          <i className="fas fa-boxes"></i> Products
        </NavLink>
        <NavLink to="/admin/dashboard/societies" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleItemClick}>
          <i className="fas fa-building"></i> Societies
        </NavLink>
        <NavLink to="/admin/dashboard/delivery-fleet" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleItemClick}>
          <i className="fas fa-truck"></i> Delivery Fleet
        </NavLink>
        <NavLink to="/admin/dashboard/reports" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleItemClick}>
          <i className="fas fa-flag"></i> Reports
        </NavLink>
      </nav>
    </aside>
  );
};

export default AdminSideNavbar;