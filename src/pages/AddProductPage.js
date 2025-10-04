import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AddProductPage.css';

const AddProductPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrls: [''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || currentUser.userType !== 'seller') {
    // Redirect non-sellers
    navigate('/products');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImageUrls = [...product.imageUrls];
        newImageUrls[index] = reader.result; // reader.result contains the base64 data URL
        setProduct(prev => ({
          ...prev,
          imageUrls: newImageUrls,
        }));
      };
      reader.readAsDataURL(file);
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

    const newProduct = {
      ...product,
      price: parseFloat(product.price),
      userId: currentUser.id,
      status: 'available',
      postedDate: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        alert('Product added successfully!');
        navigate('/seller/dashboard');
      } else {
        throw new Error('Failed to add product.');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-product-container">
      <h1>Add New Product</h1>
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
          <label htmlFor="category">Category</label>
          <input type="text" id="category" name="category" value={product.category} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label>Image URLs</label>
          {product.imageUrls.map((url, index) => (
            <div key={index} className="image-url-field">
              <div className="image-upload-wrapper">
                <input
                  type="file"
                  id={`image-upload-${index}`}
                  className="image-file-input"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => handleImageFileChange(index, e.target.files[0])}
                />
                <label htmlFor={`image-upload-${index}`} className="image-file-label">
                  {url ? <img src={url} alt="Preview" className="image-preview" /> : <span>+ Click to upload</span>}
                </label>
              </div>
              {product.imageUrls.length > 1 && (
                <button type="button" className="remove-image-btn" onClick={() => removeImageUrlField(index)}>&times;</button>
              )}
            </div>
          ))}
          <button type="button" className="add-image-btn" onClick={addImageUrlField}>Add Another Image</button>
        </div>
        <button type="submit" className="btn btn-primary submit-product-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProductPage;