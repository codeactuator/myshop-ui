import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { id, name, price, imageUrls, user } = product;
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    // Prevent the click from navigating to the product details page
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };
  
  return (
    <Link to={`/products/${id}`} className="product-card-link">
      <div className="product-card">
        <img src={imageUrls[0]} alt={name} className="product-image" />
        <div className="product-info">
          <h3 className="product-name">{name}</h3>
          <p className="product-price">${price.toFixed(2)}</p>
          <div className="product-seller-info">
            <span>Sold by: {user ? user.name : 'Unknown Seller'}</span>
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