import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, login } = useAuth();

  if (!currentUser) {
    return <div className="page-status">Please log in to view your profile.</div>;
  }

  const handleBecomeSeller = async () => {
    if (window.confirm('Are you sure you want to become a seller? This will grant you access to the seller dashboard.')) {
      try {
        const response = await fetch(`http://localhost:3001/users/${currentUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userType: 'seller' }),
        });

        if (response.ok) {
          const updatedUser = { ...currentUser, userType: 'seller' };
          // Update the auth context with the new user role
          login(updatedUser);
          alert('Congratulations! You are now a seller.');
        } else {
          throw new Error('Failed to update your account.');
        }
      } catch (error) {
        console.error('Error becoming a seller:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      <p><strong>Name:</strong> {currentUser.name}</p>
      <p><strong>Email:</strong> {currentUser.email}</p>
      <p><strong>Phone:</strong> {currentUser.phone}</p>
      <p><strong>Apartment:</strong> {currentUser.apartmentNumber}</p>
      {currentUser.userType === 'buyer' && (
        <div className="become-seller-section">
          <p>Want to sell your items? Upgrade your account to a seller.</p>
          <button className="btn btn-primary" onClick={handleBecomeSeller}>Become a Seller</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;