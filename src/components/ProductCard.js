import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProductCard.css';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { id, name, price, imageUrls, user } = product;
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    // Prevent the click from navigating to the product details page
    e.preventDefault();
    e.stopPropagation();
    if (currentUser) {
      addToCart(product);
    } else {
      alert('Please log in to add items to your cart.');
      navigate('/welcome');
    }
  };
  
  return (
    <Link to={`/products/${id}`} className="product-card-link">
      <div className="product-card">
        <img src={imageUrls[0]} alt={name} className="product-image" />
        <div className="product-info">
          <h3 className="product-name">{name}</h3>
          <p className="product-price">${price.toFixed(2)}</p>
          <div className="product-seller-info">
            <span>Sold by: {user ? (user.shopName || user.name) : 'Unknown Seller'}</span>
            <span>{user ? `(Apt: ${user.apartmentNumber})` : ''}</span>
          </div>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;