import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './AddProductPage.css'; // Re-use styles for image upload
import './ProfilePage.css'; // Re-use some profile styles

const ShopConfigPage = () => {
  const { currentUser, login } = useAuth();
  const [shopName, setShopName] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [themeColor, setThemeColor] = useState('#7B2CBF');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopFront = async () => {
      if (currentUser) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/shop-front?sellerId=${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setShopName(data.shopName || currentUser.shopName || '');
            setBannerImageUrl(data.bannerImageUrl || '');
            setProfileImageUrl(data.profileImageUrl || '');
            setShopTagline(data.shopTagline || '');
            setThemeColor(data.themeColor || '#7B2CBF');
          }
        } catch (error) {
          console.error("Failed to fetch shop front data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchShopFront();
  }, [currentUser]);

  if (!currentUser || currentUser.userType?.toLowerCase() !== 'seller') {
    return <Navigate to="/products" replace />;
  }

  const handleImageFileChange = (file, type) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'banner') {
          setBannerImageUrl(reader.result);
        } else if (type === 'profile') {
          setProfileImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShopDetailsSubmit = async (e) => {
    e.preventDefault();

    const payload = {
        shopName: shopName.trim(),
        bannerImageUrl,
        profileImageUrl,
        shopTagline: shopTagline.trim(),
        themeColor,
    };

    if (!payload.shopName) {
        alert('Shop name cannot be empty.');
        return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/shop-front?sellerId=${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // We don't need to call login() here as the user object itself hasn't changed, only the related shop-front
        alert('Shop details updated successfully! Changes will be visible on your shop page.');
      } else {
        throw new Error('Failed to update shop details.');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div className="page-status">Loading Shop Configuration...</div>;

  return (
    <div className="profile-container">
      <h1>Shop Configuration</h1>
      <form onSubmit={handleShopDetailsSubmit} className="add-product-form">
        <div className="form-group">
          <label htmlFor="shopName">Shop Name</label>
          <input type="text" id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g., Alice's Art & Craft" required />
        </div>
        <div className="form-group">
          <label htmlFor="shopTagline">Shop Tagline</label>
          <input type="text" id="shopTagline" value={shopTagline} onChange={(e) => setShopTagline(e.target.value)} placeholder="e.g., Handcrafted goods with love" />
        </div>
        <div className="form-group">
          <label htmlFor="themeColor">Shop Theme Color</label>
          <input type="color" id="themeColor" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Profile Image</label>
          <div className="image-upload-wrapper">
            <input type="file" id="profile-image-upload" className="image-file-input" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleImageFileChange(e.target.files[0], 'profile')} />
            <label htmlFor="profile-image-upload" className="image-file-label">
              {profileImageUrl ? <img src={profileImageUrl} alt="Profile Preview" className="image-preview" /> : <span>+ Click to upload</span>}
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Banner Image</label>
          <div className="image-upload-wrapper banner-upload-wrapper">
            <input type="file" id="banner-image-upload" className="image-file-input" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleImageFileChange(e.target.files[0], 'banner')} />
            <label htmlFor="banner-image-upload" className="image-file-label">
              {bannerImageUrl ? <img src={bannerImageUrl} alt="Banner Preview" className="image-preview" /> : <span>+ Click to upload</span>}
            </label>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Save Shop Details</button>
      </form>
    </div>
  );
};

export default ShopConfigPage;