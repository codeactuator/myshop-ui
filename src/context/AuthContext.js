import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('hungrynow_user');

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      if (token) {
        try {
          const response = await api.get('/auth/me');
          const freshUser = response.data;
          setCurrentUser(freshUser);
          localStorage.setItem('hungrynow_user', JSON.stringify(freshUser));
        } catch (err) {
          console.error("Token verification failed:", err);
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            setCurrentUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('hungrynow_user');
          }
        }
      }
      setLoading(false);
    };
    checkAuthStatus();
  }, []);

  const login = (userData, token = null) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    if (JSON.stringify(currentUser) !== JSON.stringify(userData)) {
      setCurrentUser(userData);
      localStorage.setItem('hungrynow_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hungrynow_user');
    localStorage.removeItem('token');
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};