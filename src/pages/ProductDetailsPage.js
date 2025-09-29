import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css';
import Review from '../components/Review';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // Fetch product and reviews in parallel for better performance
        const [productResponse, reviewsResponse] = await Promise.all([
          fetch(`http://localhost:3001/products/${productId}?_expand=user`),
          fetch(`http://localhost:3001/reviews?productId=${productId}&_expand=user`)
        ]);

        if (!productResponse.ok) {
          throw new Error(`Product not found (status: ${productResponse.status})`);
        }

        if (!reviewsResponse.ok) {
          throw new Error(`Could not fetch reviews (status: ${reviewsResponse.status})`);
        }

        const productData = await productResponse.json();
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

  const handleAddToCart = () => {
    if (currentUser) {
      addToCart(product);
    } else {
      alert('Please log in to add items to your cart.');
      navigate('/welcome');
    }
  };

  return (
    <div className="product-details-container">
      <Link to="/products" className="back-link">&larr; Back to all products</Link>
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
            <p><strong>Name:</strong> {product.user?.name || 'N/A'}</p>
            <p><strong>Apartment:</strong> {product.user?.apartmentNumber || 'N/A'}</p>
          </div>
          <button className="btn btn-primary contact-seller-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
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

export default ProductDetailsPage;