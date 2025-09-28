import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { cartCount } = useCart();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/products" className="navbar-logo">
          My Shop
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/my-orders" className="nav-links">
              My Orders
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/cart" className="nav-links">
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;