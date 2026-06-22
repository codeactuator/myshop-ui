import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if user data exists in local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('hungrynow_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Only update if the user data has actually changed to prevent unnecessary re-renders
    // A simple stringify comparison is often sufficient for DTO-like objects
    if (JSON.stringify(currentUser) !== JSON.stringify(userData)) {
      setCurrentUser(userData);
      localStorage.setItem('hungrynow_user', JSON.stringify(userData));
    } else {
      // console.log("User data is identical, skipping state update.");
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hungrynow_user');
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};