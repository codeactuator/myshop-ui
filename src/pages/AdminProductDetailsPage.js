import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductDetailsPage.css'; // Re-using styles
import Review from '../components/Review';

const AdminProductDetailsPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // Step 1: Fetch the product
        const productResponse = await fetch(`http://localhost:3001/products/${productId}`);
        if (!productResponse.ok) {
          throw new Error(`Product not found (status: ${productResponse.status})`);
        }
        const productData = await productResponse.json();

        // Step 2: Fetch the seller information using the userId from the product
        const userResponse = await fetch(`http://localhost:3001/users/${productData.userId}`);
        if (userResponse.ok) {
          productData.user = await userResponse.json();
        }

        // Step 3: Fetch the reviews for the product
        const reviewsResponse = await fetch(`http://localhost:3001/reviews?productId=${productId}&_expand=user`);
        if (!reviewsResponse.ok) {
          throw new Error(`Could not fetch reviews (status: ${reviewsResponse.status})`);
        }
        const reviewsData = await reviewsResponse.json();

        setProduct(productData);
        setReviews(reviewsData);
        if (productData.imageUrls && productData.imageUrls.length > 0) {
          setSelectedImage(productData.imageUrls[0]);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  if (loading) return <div className="page-status">Loading...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;
  if (!product) return <div className="page-status">Product not found.</div>;

  return (
    <div className="product-details-container">
      <Link to="/admin/dashboard/products" className="back-link">&larr; Back to Product Management</Link>
      <div className="details-content">
        <div className="details-image-container">
          <img src={selectedImage} alt={product.name} className="details-image-main" />
          <div className="details-thumbnails">
            {product.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${product.name} thumbnail ${index + 1}`}
                className={`thumbnail-image ${url === selectedImage ? 'active' : ''}`}
                onClick={() => setSelectedImage(url)}
              />
            ))}
          </div>
        </div>
        <div className="details-info-container">
          <h1 className="details-name">{product.name}</h1>
          <p className="details-price">${product.price.toFixed(2)}</p>
          <p className="details-category">Category: <span>{product.category}</span></p>
          <div className="details-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
          <div className="details-seller">
            <h3>Seller Information</h3>
            <p className="seller-info-name">
              <strong>Sold by:</strong> {product.user?.shopName || product.user?.name || 'N/A'}
              {product.user?.isVerified && (
                <i className="fas fa-check-circle verified-badge" title="Verified Resident"></i>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="details-reviews-section">
        <h2>Customer Reviews</h2>
        {reviews.length > 0 ? (
          reviews.map(review => (
            <Review key={review.id} review={review} />
          ))
        ) : (
          <p>No reviews for this product yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminProductDetailsPage;