import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, login } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [apartmentNumber, setApartmentNumber] = useState(currentUser?.apartmentNumber || '');
  const [shopName, setShopName] = useState(currentUser?.shopName || '');
  const [societies, setSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState(currentUser?.buyerSociety?.id || '');
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/societies`);
        if (response.ok) {
          const data = await response.json();
          setSocieties(data);
          if (currentUser?.buyerSociety) {
            setSelectedSocietyId(Number(currentUser.buyerSociety.id));
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
  }, [currentUser?.id]);

  // Reactively sync selected societies when the currentUser context updates
  useEffect(() => {
    if (currentUser?.buyerSociety) {
      setSelectedSocietyId(Number(currentUser.buyerSociety.id));
    }
  }, [currentUser?.buyerSociety]);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      alert('Email cannot be empty.');
      return;
    }

    try {
      const payload = {
        name,
        email,
        apartmentNumber,
        buyerSociety: selectedSocietyId ? { id: Number(selectedSocietyId) } : null
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        login(updatedUser);
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while saving your profile. Please try again.');
    }
  };

  // Handle toggle selection for sellers
  const handleSocietyCardClick = (id) => {
    setSelectedSocietyId(id);
  };

  // Filter societies based on the search query input (checks name and area description)
  const filteredSocieties = societies.filter((society) => {
    const query = searchQuery.toLowerCase();
    return (society.name?.toLowerCase().includes(query) || 
            (society.area && society.area.toLowerCase().includes(query)));
  });

  return (
    <div className="profile-container">
      <h1>My Profile</h1>

      <form onSubmit={handleUpdateProfile} className="profile-edit-form">
        <div className="form-group mb-3">
          <label><strong>Phone Number (Registered):</strong></label>
          <input
            type="text"
            className="form-control"
            value={currentUser.phone}
            disabled
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          />
          <small className="form-text text-muted">Phone number cannot be changed.</small>
        </div>

        <div className="form-group mb-3">
          <label htmlFor="profile-name"><strong>Name:</strong></label>
          <input
            id="profile-name"
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="profile-email"><strong>Email:</strong></label>
          <input
            id="profile-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="profile-apartment"><strong>Apartment Number:</strong></label>
          <input
            id="profile-apartment"
            type="text"
            className="form-control"
            value={apartmentNumber}
            onChange={(e) => setApartmentNumber(e.target.value)}
          />
        </div>

        {currentUser.serviceSocieties && currentUser.serviceSocieties.length > 0 && (
          <p><strong>Current Home Address:</strong> {currentUser.buyerSociety?.name || 'Not set'}</p>
        )}

        <div className="society-selection-section">
        <h3>Select Your Society</h3>
        <div className="society-search-wrapper" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search societies by name or location description..."
            className="form-control society-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoadingSocieties ? (
          <p>Loading societies...</p>
        ) : (
          <div className="society-form">
            <div className="society-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto', padding: '0.25rem' }}>
              {filteredSocieties.length > 0 ? (
                filteredSocieties.map((society) => {
                  const isSelected = Number(selectedSocietyId) === Number(society.id);
                  return (
                    <div
                      key={society.id}
                      className={`society-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSocietyCardClick(society.id)}
                      style={{ border: isSelected ? '2px solid #5A189A' : '1px solid #ccc', borderRadius: '8px', padding: '1rem', cursor: 'pointer', backgroundColor: isSelected ? '#f5eeff' : '#fff', transition: 'all 0.2s ease-in-out', position: 'relative' }}
                    >
                      {isSelected && (
                        <div className="selection-tickmark" style={{ position: 'absolute', top: '8px', right: '12px', backgroundColor: '#5A189A', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          ✓
                        </div>
                      )}
                      <h4 style={{ margin: '0 0 0.5rem 0', color: isSelected ? '#5A189A' : '#333' }}>{society.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{society.area || 'No location description available'}</p>
                    </div>
                  );
                })
              ) : (
                <p style={{ gridColumn: '1 / -1', color: '#888' }}>No societies found matching your search.</p>
              )}
            </div>
          </div>
        )}
      </div>

        <button type="submit" className="btn btn-primary mt-3" style={{ width: '100%' }}>
          Save Changes
        </button>
      </form>

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