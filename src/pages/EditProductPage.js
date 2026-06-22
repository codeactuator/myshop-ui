import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/Modal';
import SafeImage from '../components/SafeImage';
import './AddProductPage.css'; // Re-using the same styles as the Add Product page

const EditProductPage = () => {
  const { productId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info', onConfirm: null });

  const showAlert = (message, type = 'info', onConfirm = null) => {
    setAlertModal({ isOpen: true, message, type, onConfirm });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found.');
        const data = await response.json();

        // Ensure the current user is the owner of the product
        if (Number(data.userId) !== currentUser.id) {
          showAlert('You are not authorized to edit this product.', 'error', () => {
            navigate('/seller/inventory');
          });
          return;
        }
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/seller/inventory');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProduct();
    }
  }, [productId, currentUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const uploadFileWithProgress = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${process.env.REACT_APP_API_URL}/products/upload-image`);

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

  const handleImageFileChange = async (index, file) => {
    if (file) {
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));

      try {
        const data = await uploadFileWithProgress(file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [index]: progress }));
        });
        const newImageUrls = [...product.imageUrls];
        newImageUrls[index] = data.imageUrl; // Store GCS public URL in state
        setProduct(prev => ({
          ...prev,
          imageUrls: newImageUrls,
        }));
      } catch (error) {
        console.error('Error uploading image to GCS:', error);
        showAlert('Failed to upload image to Google Cloud Storage. Please try again.', 'error');
      } finally {
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });
        }, 1000);
      }
    }
  };

  const addImageUrlField = () => {
    setProduct(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  };

  const removeImageUrlField = (index) => {
    if (product.imageUrls.length > 1) {
      const newImageUrls = product.imageUrls.filter((_, i) => i !== index);
      setProduct(prev => ({ ...prev, imageUrls: newImageUrls }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Remove the 'user' object if it was enriched, as it's not expected by the ProductDto
    const { user, ...productToUpdate } = product;
    const updatedProduct = {
      ...productToUpdate,
      price: parseFloat(product.price),
      stock: parseInt(product.stock, 10) || 0,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        showAlert('Product updated successfully!', 'success', () => {
          navigate('/seller/inventory');
        });
      } else {
        throw new Error('Failed to update product.');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showAlert('An error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="page-status">Loading product for editing...</div>;
  if (!product) return <div className="page-status">Product not found.</div>;

  return (
    <>
    <div className="add-product-container">
      <h1>Edit Product</h1>
      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-group">
          <label htmlFor="name">Product Name</label>
          <input type="text" id="name" name="name" value={product.name} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" value={product.description} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price</label>
          <input type="number" id="price" name="price" value={product.price} onChange={handleInputChange} required min="0" step="0.01" />
        </div>
        <div className="form-group">
          <label htmlFor="stock">Stock</label>
          <input type="number" id="stock" name="stock" value={product.stock || ''} onChange={handleInputChange} required min="0" />
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input type="text" id="category" name="category" value={product.category} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label>Image URLs</label>
          {product.imageUrls.map((url, index) => (
            <div key={index} className="image-url-field">
          <div className="image-upload-wrapper" style={{ position: 'relative' }}>
                <input
                  type="file"
                  id={`image-upload-${index}`}
                  className="image-file-input"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => handleImageFileChange(index, e.target.files[0])}
              disabled={uploadProgress[index] !== undefined}
                />
                <label htmlFor={`image-upload-${index}`} className="image-file-label">
                  {url ? <SafeImage src={url} alt="Preview" className="image-preview" /> : <span>+ Click to upload</span>}
                </label>
            {uploadProgress[index] !== undefined && (
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
                    width: `${uploadProgress[index]}%`,
                    backgroundColor: '#5A189A',
                    height: '100%',
                    transition: 'width 0.2s ease-in-out'
                  }}></div>
                </div>
                <span style={{ color: '#fff', fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>
                  Uploading... {uploadProgress[index]}%
                </span>
              </div>
            )}
              </div>
              {product.imageUrls.length > 1 && (
                <button type="button" className="remove-image-btn" onClick={() => removeImageUrlField(index)}>&times;</button>
              )}
            </div>
          ))}
          <button type="button" className="add-image-btn" onClick={addImageUrlField}>Add Another Image</button>
        </div>
        <button type="submit" className="btn btn-primary submit-product-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
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

export default EditProductPage;