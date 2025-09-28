import React, { useEffect } from 'react';
import './SplashScreen.css';
import logo from '../logo.svg'; // Re-using the React logo for now

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <img src={logo} className="splash-logo" alt="logo" />
      <h1>my-shop-ui</h1>
    </div>
  );
};

export default SplashScreen;