import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SideNavbar from './SideNavbar';
import './MainLayout.css';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(true);

  const toggleSideNav = () => {
    setIsSideNavCollapsed(!isSideNavCollapsed);
  };

  const { currentUser } = useAuth();

  return (
    <>
      <Navbar toggleSideNav={toggleSideNav} />
      <div className={`main-layout-container ${isSideNavCollapsed ? 'sidenav-collapsed' : ''}`}>
        {currentUser && <SideNavbar isCollapsed={isSideNavCollapsed} />}
        <main className={`main-content ${!currentUser ? 'full-width' : ''}`}><Outlet /></main>
      </div>
    </>
  );
};

export default MainLayout;