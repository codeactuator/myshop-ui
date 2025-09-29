import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div className="page-status">Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      <p><strong>Name:</strong> {currentUser.name}</p>
      <p><strong>Email:</strong> {currentUser.email}</p>
      <p><strong>Phone:</strong> {currentUser.phone}</p>
      <p><strong>Apartment:</strong> {currentUser.apartmentNumber}</p>
    </div>
  );
};

export default ProfilePage;