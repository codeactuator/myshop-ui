import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
 
const Navbar = ({ toggleSideNav }) => {
  const { cartCount } = useCart();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [animateCart, setAnimateCart] = useState(false);

  useEffect(() => {
    const handleCartTrigger = () => {
      setAnimateCart(true);
      // Reset the animation class state after the wiggle animation (800ms) finishes
      const timer = setTimeout(() => setAnimateCart(false), 800);
      return () => clearTimeout(timer);
    };

    window.addEventListener('cart-item-added', handleCartTrigger);
    return () => {
      window.removeEventListener('cart-item-added', handleCartTrigger);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/products');
  };

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
            hungrynow
          </Link>
        </div>
        <ul className="nav-menu">
          {currentUser ? (
            <>
              <li className="nav-item">
                <Link to="/cart" className={`nav-links ${animateCart ? 'cart-animate-trigger' : ''}`}>
                  <i className="fas fa-shopping-cart"></i>
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              </li>
              <li className="nav-item">
                <div className="nav-links" onClick={handleLogout} title="Sign Out">
                  <i className="fas fa-power-off"></i>
                </div>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <Link to="/welcome" className="nav-links" title="Sign In">
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