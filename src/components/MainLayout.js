import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SideNavbar from './SideNavbar';
import './MainLayout.css';

const MainLayout = () => {
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);

  const toggleSideNav = () => {
    setIsSideNavCollapsed(!isSideNavCollapsed);
  };

  return (
    <>
      <Navbar toggleSideNav={toggleSideNav} />
      <div className={`main-layout-container ${isSideNavCollapsed ? 'sidenav-collapsed' : ''}`}>
        <SideNavbar isCollapsed={isSideNavCollapsed} />
        <main className="main-content"><Outlet /></main>
      </div>
    </>
  );
};

export default MainLayout;