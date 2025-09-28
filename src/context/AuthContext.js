import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // In a real app, this would be null initially and set upon login.
  // For now, we'll hardcode a user to simulate a logged-in state.
  const [currentUser] = useState({
    id: 1,
    name: "Alice Johnson",
    apartmentNumber: "A-101",
    phone: "123-456-7890",
    email: "alice@example.com"
  });

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};