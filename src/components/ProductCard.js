import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProductCard.css';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SafeImage from './SafeImage';

const ProductCard = ({ product }) => {
  const { id, name, price, imageUrls, user, description } = product;
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  const handleAddToCart = (e) => {
    // Prevent the click from navigating to the product details page
    e.preventDefault();
    e.stopPropagation();
    if (currentUser) {
      addToCart(product);
      
      // Dispatch a global event so the navigation header can animate the cart icon
      const event = new CustomEvent('cart-item-added');
      window.dispatchEvent(event);
      
      // Trigger "Added!" state transition
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);

      // Generate dynamic sparkle coordinates near the clicked cursor/button area
      const newSparkles = Array.from({ length: 30 }).map((_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100, // Spread across the entire button width
        top: Math.random() * 60 - 30,  // Disperse slightly upwards and downwards from center
        delay: Math.random() * 0.5 // Stagger the appearance more
      }));
      setSparkles(newSparkles);

      // Clean up sparkle elements after animation finishes
      setTimeout(() => setSparkles([]), 2500); // Match the new animation duration
    } else {
      alert('Please log in to add items to your cart.');
      navigate('/welcome', { state: { addProductAfterLogin: product.id } });
    }
  };

  const handleToggleDescription = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  return (
    <Link to={`/products/${id}`} className="product-card-link">
      <div className="product-card">
        <div className="product-info">
          <h3 className="product-name">{name}</h3>
          
          <div className="product-seller-info">
            <span className="seller-name">
              Sold by: {user ? (user.shopName || user.name) : 'Unknown Seller'}
              {user?.isVerified && (
                <i className="fas fa-check-circle verified-badge" style={{ marginLeft: '5px', color: '#4CAF50' }} title="Verified Resident"></i>
              )}
            </span>
          </div>

          <div className="product-image-wrapper">
            <SafeImage src={imageUrls[0]} alt={name} className="product-image" />
          </div>

          <p className="product-price">₹{price.toFixed(2)}</p>

          {description && (
            <div className="product-description-container">
              <p className="product-description-text">
                {isExpanded ? description : `${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`}
                {description.length > 100 && (
                  <button className="description-toggle-btn" onClick={handleToggleDescription}>
                    {isExpanded ? ' Less' : ' More'}
                  </button>
                )}
              </p>
            </div>
          )}
          
          <div className="cart-button-container" style={{ position: 'relative', width: '100%' }}>
            {sparkles.map((s) => (
              <span
                key={s.id}
                className="sparkle-particle"
                style={{ left: `${s.left}%`, top: `${s.top}px`, animationDelay: `${s.delay}s` }}
              />
            ))}
            <button 
              className={`add-to-cart-btn ${isAdded ? 'added' : ''}`} 
              onClick={handleAddToCart}
              disabled={isAdded}
            >
              {isAdded ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;