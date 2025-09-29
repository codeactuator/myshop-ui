import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
 
const Navbar = ({ toggleSideNav }) => {
  const { cartCount } = useCart();
  const { currentUser } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left-section">
          {currentUser && (
            <button className="menu-toggle-btn" onClick={toggleSideNav}>
              <i className="fas fa-bars"></i>
            </button>
          )}
          <Link to="/products" className="navbar-logo">
            My Shop
          </Link>
        </div>
        <ul className="nav-menu">
          {currentUser && (
            <li className="nav-item">
              <Link to="/cart" className="nav-links">
                <i className="fas fa-shopping-cart"></i>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </li>
          )}
          {!currentUser && (
            <li className="nav-item">
              <Link to="/welcome" className="nav-links nav-button">
                <i className="fas fa-sign-in-alt"></i>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;