import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust import to match your AuthContext path

const ProfileGate = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Wait until user details are fetched to avoid false redirections
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if the user is authenticated but lacks either apartment number or society
  console.log("ProfileGate - Current User:", currentUser);
  console.log("ProfileGate - Apartment:", currentUser?.apartmentNumber);
  console.log("ProfileGate - Society ID:", currentUser?.buyerSociety?.id);
  const isProfileIncomplete = currentUser && (!currentUser.apartmentNumber || !currentUser.buyerSociety?.id);

  if (isProfileIncomplete) {
    return (
      <Navigate
        to="/profile"
        state={{ showWarning: true, message: "Please select your society and fill in your apartment number to explore the products available on the platform." }}
        replace
      />
    );
  }

  // If profile is complete or user is not logged in (handled by standard Auth router), proceed
  return <Outlet />;
};

export default ProfileGate;