import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import './AddProductPage.css'; // Re-using the same styles as the Add Product page

const EditProductPage = () => {
  const { productId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found.');
        const data = await response.json();

        // Ensure the current user is the owner of the product
        if (data.userId !== currentUser.id) {
          alert('You are not authorized to edit this product.');
          navigate('/seller/inventory');
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

  const handleImageUrlChange = (index, value) => {
    const newImageUrls = [...product.imageUrls];
    newImageUrls[index] = value;
    setProduct(prev => ({ ...prev, imageUrls: newImageUrls }));
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

    const updatedProduct = {
      ...product,
      price: parseFloat(product.price),
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        alert('Product updated successfully!');
        navigate('/seller/inventory');
      } else {
        throw new Error('Failed to update product.');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="page-status">Loading product for editing...</div>;
  if (!product) return <div className="page-status">Product not found.</div>;

  return (
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
          <label htmlFor="category">Category</label>
          <input type="text" id="category" name="category" value={product.category} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label>Image URLs</label>
          {product.imageUrls.map((url, index) => (
            <div key={index} className="image-url-field">
              <input type="url" placeholder="https://example.com/image.jpg" value={url} onChange={(e) => handleImageUrlChange(index, e.target.value)} required />
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
  );
};

export default EditProductPage;