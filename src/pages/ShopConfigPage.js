import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import './AddProductPage.css'; // Re-using form styles
import SafeImage from '../components/SafeImage';

const ShopConfigPage = () => {
  const { currentUser, login } = useAuth();
  const [upiSettings, setUpiSettings] = useState({
    shopName: '',
    payeeName: '',
    shopTagline: '',
    gpayId: '',
    paytmId: '',
    phonepeId: '',
    bannerImageUrl: ''
  });
  const [societies, setSocieties] = useState([]);
  const [selectedSocietyIds, setSelectedSocietyIds] = useState([]);
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true);
  const [societySearchQuery, setSocietySearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info', onConfirm: null });

  const showAlert = (message, type = 'info', onConfirm = null) => {
    setAlertModal({ isOpen: true, message, type, onConfirm });
  };

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/societies`);
        if (response.ok) {
          const data = await response.json();
          setSocieties(data);
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
  }, []);

  useEffect(() => {
    const fetchFreshShopConfig = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/shop-front?sellerId=${currentUser.id}`);
        if (response.ok) {
          const sfData = await response.json();
          const sfObj = Array.isArray(sfData) ? sfData[0] : sfData;
          if (sfObj) {
          setUpiSettings({
              shopName: sfObj.shopName || currentUser.shopName || '',
              payeeName: sfObj.payeeName || '',
              shopTagline: sfObj.shopTagline || '',
              gpayId: sfObj.gpayId || '',
              paytmId: sfObj.paytmId || '',
              phonepeId: sfObj.phonepeId || '',
              bannerImageUrl: sfObj.bannerImageUrl || ''
          });
          if (currentUser?.serviceSocieties) {
            setSelectedSocietyIds(currentUser.serviceSocieties.map(s => Number(s.id)));
          }
          }
        }
      } catch (error) {
        console.error('Error fetching fresh shop configuration:', error);
      }
    };

    fetchFreshShopConfig();
  }, [currentUser?.id, currentUser?.shopName, currentUser?.serviceSocieties]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpiSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSocietyCardClick = (id) => {
    setSelectedSocietyIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const uploadFileWithProgress = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${process.env.REACT_APP_API_URL}/shop-front/upload-banner`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Failed to parse upload response.'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload.'));

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

  const handleBannerChange = async (file) => {
    if (file) {
      setUploadProgress(0);
      try {
        const data = await uploadFileWithProgress(file, (progress) => {
          setUploadProgress(progress);
        });
        setUpiSettings(prev => ({
          ...prev,
          bannerImageUrl: data.imageUrl
        }));
      } catch (error) {
        console.error('Error uploading banner to GCS:', error);
        showAlert('Failed to upload banner image to Google Cloud Storage. Please try again.', 'error');
      } finally {
        setTimeout(() => {
          setUploadProgress(null);
        }, 1000);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const userPayload = {
        shopName: upiSettings.shopName,
        serviceSocieties: selectedSocietyIds.map(id => ({ id }))
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      });

      if (response.ok) {
        const updatedUser = await response.json();

        // Force sync local state with the saved response
        if (updatedUser?.serviceSocieties) {
          setSelectedSocietyIds(updatedUser.serviceSocieties.map(s => Number(s.id)));
        }

        // Save the updated configuration to the ShopFront record
        try {
          const sfRes = await fetch(`${process.env.REACT_APP_API_URL}/shop-front?sellerId=${currentUser.id}`);
          if (sfRes.ok) {
            const sfData = await sfRes.json();
            const sfObj = Array.isArray(sfData) ? sfData[0] : sfData;

            if (sfObj) {
              await fetch(`${process.env.REACT_APP_API_URL}/shop-front?sellerId=${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...sfObj,
                  shopName: upiSettings.shopName,
                  payeeName: upiSettings.payeeName,
                  shopTagline: upiSettings.shopTagline,
                  gpayId: upiSettings.gpayId,
                  paytmId: upiSettings.paytmId,
                  phonepeId: upiSettings.phonepeId,
                  bannerImageUrl: upiSettings.bannerImageUrl
                }),
              });
            }
          }
        } catch (sfErr) {
          console.warn("ShopFront real-time database synchronization bypassed:", sfErr);
        }

        login(updatedUser); // Update local auth context
        showAlert('Payment settings updated successfully!', 'success');
      } else {
        throw new Error('Failed to update settings.');
      }
    } catch (error) {
      console.error('Error updating shop config:', error);
      showAlert('An error occurred. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSocieties = societies.filter((society) => {
    const query = societySearchQuery.toLowerCase();
    return (society.name?.toLowerCase().includes(query) || (society.area && society.area.toLowerCase().includes(query)));
  });

  return (
    <>
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
          <div className="image-upload-wrapper" style={{ position: 'relative' }}>
            <input
              type="file"
              id="banner-upload"
              className="image-file-input"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => handleBannerChange(e.target.files[0])}
              disabled={uploadProgress !== null}
            />
            <label htmlFor="banner-upload" className="image-file-label" style={{ height: '200px' }}>
              {upiSettings.bannerImageUrl ? <SafeImage src={upiSettings.bannerImageUrl} alt="Banner Preview" className="image-preview" /> : <span>+ Upload Shop Banner</span>}
            </label>
            {uploadProgress !== null && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.7)',
                padding: '4px',
                borderRadius: '0 0 8px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
              }}>
                <div style={{
                  width: '100%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: '#5A189A',
                    height: '100%',
                    transition: 'width 0.2s ease-in-out'
                  }}></div>
                </div>
                <span style={{ color: '#fff', fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>
                  Uploading... {uploadProgress}%
                </span>
              </div>
            )}
          </div>
        </div>

        <h2 style={{ marginTop: '2rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Service Areas (Societies)</h2>
        <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>Select the societies where you can deliver products or provide services.</p>
        
        <div className="form-group">
          <input
            type="text"
            placeholder="Search societies by name or location..."
            className="form-control society-search-input"
            value={societySearchQuery}
            onChange={(e) => setSocietySearchQuery(e.target.value)}
          />
        </div>

        {isLoadingSocieties ? (
          <p>Loading service areas...</p>
        ) : (
          <div className="society-form" style={{ marginBottom: '2rem' }}>
            <div className="society-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', maxHeight: '250px', overflowY: 'auto', padding: '0.25rem' }}>
              {filteredSocieties.map((society) => {
                const isSelected = selectedSocietyIds.includes(society.id);
                return (
                  <div
                    key={society.id}
                    className={`society-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSocietyCardClick(society.id)}
                    style={{ border: isSelected ? '2px solid #5A189A' : '1px solid #ccc', borderRadius: '8px', padding: '1rem', cursor: 'pointer', backgroundColor: isSelected ? '#f5eeff' : '#fff', transition: 'all 0.2s ease-in-out', position: 'relative' }}
                  >
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: isSelected ? '#5A189A' : '#333' }}>{society.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{society.area || 'No location description available'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <h2 style={{ marginTop: '2rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Payment IDs</h2>

        <div className="form-group">
          <label htmlFor="payeeName">Bank Account Holder Name (Payee Name)</label>
          <input type="text" id="payeeName" name="payeeName" value={upiSettings.payeeName} onChange={handleInputChange} placeholder="Legal name registered with your bank" required />
        </div>

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

    <Modal isOpen={alertModal.isOpen} onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}>
      <div className="alert-modal-content" style={{ textAlign: 'center' }}>
        <h2 style={{ color: alertModal.type === 'success' ? '#28a745' : alertModal.type === 'error' ? '#dc3545' : '#333', marginBottom: '1rem' }}>
          {alertModal.type === 'success' ? 'Success' : alertModal.type === 'error' ? 'Error' : 'Notification'}
        </h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#555' }}>{alertModal.message}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setAlertModal(prev => ({ ...prev, isOpen: false }));
            if (alertModal.onConfirm) alertModal.onConfirm();
          }}
        >
          OK
        </button>
      </div>
    </Modal>
    </>
  );
};

export default ShopConfigPage;