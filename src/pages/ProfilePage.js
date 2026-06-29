import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, login } = useAuth();
  const [shopName, setShopName] = useState(currentUser?.shopName || '');
  const [societies, setSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState(currentUser?.society?.id || '');
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/societies`);
        if (response.ok) {
          const data = await response.json();
          setSocieties(data);
          if (currentUser?.society?.id) {
            setSelectedSocietyId(currentUser.society.id);
          }
        } else {
          console.error('Failed to fetch societies');
        }
      } catch (error) {
        console.error('Error fetching societies:', error);
      } finally {
        setIsLoadingSocieties(false);
      }
    };

    fetchSocieties();
  }, [currentUser?.society?.id]);

  if (!currentUser) {
    return <div className="page-status">Please log in to view your profile.</div>;
  }

  const handleBecomeSeller = async (e) => {
    e.preventDefault();
    if (!shopName) {
      alert('Please enter a shop name.');
      return;
    }
    if (window.confirm('Are you sure you want to become a seller? This will grant you access to the seller dashboard.')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${currentUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userType: 'seller', shopName: shopName }),
        });

        if (response.ok) {
          const updatedUser = { ...currentUser, userType: 'seller', shopName: shopName };
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

  const handleSaveSociety = () => {
    // TODO: Implement backend API call to update user's society
    console.log('Selected society to save:', selectedSocietyId);
    alert('Society selection saving is not implemented yet.');
  };

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      <p><strong>Name:</strong> {currentUser.name}</p>
      <p><strong>Email:</strong> {currentUser.email}</p>
      <p><strong>Phone:</strong> {currentUser.phone}</p>
      <p><strong>Apartment:</strong> {currentUser.apartmentNumber}</p>
      {currentUser.society && <p><strong>Society:</strong> {currentUser.society.name}</p>}

      <div className="society-selection-section">
        <h3>Select Your Society</h3>
        {isLoadingSocieties ? (
          <p>Loading societies...</p>
        ) : (
          <div className="society-form">
            <select
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
              className="society-select"
            >
              <option value="">-- Select a Society --</option>
              {societies.map((society) => (
                <option key={society.id} value={society.id}>
                  {society.name}
                </option>
              ))}
            </select>
            <button onClick={handleSaveSociety} className="btn btn-secondary">Save Society</button>
          </div>
        )}
      </div>

      {currentUser.userType === 'seller' && currentUser.shopName && (
        <p><strong>Shop Name:</strong> {currentUser.shopName}</p>
      )}
      {currentUser.userType === 'buyer' && (
        <div className="become-seller-section">
          <h3>Become a Seller</h3>
          <p>Want to sell your items? Choose a shop name and upgrade your account.</p>
          <form onSubmit={handleBecomeSeller} className="become-seller-form">
            <input type="text" placeholder="Your Shop Name" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
            <button type="submit" className="btn btn-primary">Upgrade to Seller</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;