import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AddProductPage.css'; // Re-using form styles

const ShopConfigPage = () => {
  const { currentUser, login } = useAuth();
  const [upiSettings, setUpiSettings] = useState({
    shopName: '',
    shopTagline: '',
    gpayId: '',
    paytmId: '',
    phonepeId: '',
    bannerImageUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUpiSettings({
        shopName: currentUser.shopName || '',
        shopTagline: currentUser.shopTagline || '',
        gpayId: currentUser.gpayId || '',
        paytmId: currentUser.paytmId || '',
        phonepeId: currentUser.phonepeId || '',
        bannerImageUrl: currentUser.bannerImageUrl || ''
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpiSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleBannerChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpiSettings(prev => ({
          ...prev,
          bannerImageUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upiSettings),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        login(updatedUser); // Update local auth context
        alert('Payment settings updated successfully!');
      } else {
        throw new Error('Failed to update settings.');
      }
    } catch (error) {
      console.error('Error updating shop config:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-product-container">
      <h1>Shop Payment Configuration</h1>
      <p>Configure your UPI IDs to receive payments from buyers.</p>
      
      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-group">
          <label htmlFor="shopName">Shop Name</label>
          <input type="text" id="shopName" name="shopName" value={upiSettings.shopName} onChange={handleInputChange} placeholder="Your Business Name" required />
        </div>

        <div className="form-group">
          <label htmlFor="shopTagline">Shop Tagline</label>
          <input type="text" id="shopTagline" name="shopTagline" value={upiSettings.shopTagline} onChange={handleInputChange} placeholder="e.g. Freshly Baked Goodness" />
        </div>

        <div className="form-group">
          <label>Shop Banner Image</label>
          <div className="image-upload-wrapper">
            <input
              type="file"
              id="banner-upload"
              className="image-file-input"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => handleBannerChange(e.target.files[0])}
            />
            <label htmlFor="banner-upload" className="image-file-label" style={{ height: '200px' }}>
              {upiSettings.bannerImageUrl ? <img src={upiSettings.bannerImageUrl} alt="Banner Preview" className="image-preview" /> : <span>+ Upload Shop Banner</span>}
            </label>
          </div>
        </div>

        <h2 style={{ marginTop: '2rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Payment IDs</h2>

        <div className="form-group">
          <label htmlFor="gpayId">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" alt="" style={{ height: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
            Google Pay UPI ID (VPA)
          </label>
          <input type="text" id="gpayId" name="gpayId" value={upiSettings.gpayId} onChange={handleInputChange} placeholder="e.g. name@okaxis" />
        </div>
        
        <div className="form-group">
          <label htmlFor="paytmId">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png" alt="" style={{ height: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
            Paytm UPI ID (VPA)
          </label>
          <input type="text" id="paytmId" name="paytmId" value={upiSettings.paytmId} onChange={handleInputChange} placeholder="e.g. mobile@paytm" />
        </div>
        
        <div className="form-group">
          <label htmlFor="phonepeId">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png" alt="" style={{ height: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
            PhonePe UPI ID (VPA)
          </label>
          <input type="text" id="phonepeId" name="phonepeId" value={upiSettings.phonepeId} onChange={handleInputChange} placeholder="e.g. mobile@ybl" />
        </div>

        <button type="submit" className="btn btn-primary submit-product-btn" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Payment Settings'}
        </button>
      </form>
    </div>
  );
};

export default ShopConfigPage;