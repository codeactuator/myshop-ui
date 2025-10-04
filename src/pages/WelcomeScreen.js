import React, { useState } from 'react';
import './WelcomeScreen.css';
import Modal from '../components/Modal';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';


const WelcomeScreen = ({ onNavigate }) => {

 const API_URL = process.env.REACT_APP_API_URL;

  const openModal = (type) => setModalContent(type);
  const closeModal = () => setModalContent(null);
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState(null); // 'login' or 'signup'
  const { login } = useAuth();
  const { addToCart } = useCart();
  const location = useLocation();

  const handleAuthSubmit = async (formData) => {
    const formType = modalContent;
    try {
      const { mobileNumber, ...rest } = formData;
      // Check if user exists
      const response = await fetch(`${API_URL}/users?phone=${mobileNumber}`);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON! The API server might be down.");
      }

      const existingUsers = await response.json();

      if (formType === 'login') {
        if (existingUsers.length > 0) {
          const user = existingUsers[0];
          alert(`Welcome back, ${user.name}!`);
          login(user);

          // Check if a product needs to be added to the cart
          const productIdToAdd = location.state?.addProductAfterLogin;
          if (productIdToAdd) {
            const productResponse = await fetch(`${API_URL}/products/${productIdToAdd}`);
            if (productResponse.ok) {
              const productToAdd = await productResponse.json();
              addToCart(productToAdd);
              // Clear the state to prevent re-adding
              navigate(location.pathname, { replace: true, state: {} });
            }
          }

          closeModal();
          if (user.userType === 'admin') {
            navigate('/admin/dashboard');
          } else if (user.userType === 'delivery_partner') {
            navigate('/delivery/dashboard');
          } else {
            onNavigate('products'); // Navigate to products page
          }
        } else {
          alert('No user found with this mobile number. Please sign up.');
        }
      } else if (formType === 'signup') {
        if (existingUsers.length > 0) {
          alert('A user with this mobile number already exists. Please log in.');
        } else {
          // Create new user
          const newUser = { phone: mobileNumber, ...rest };
          const createResponse = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser),
          });

          if (createResponse.ok) {
            const createdUser = await createResponse.json();
            login(createdUser);

            // Check if a product needs to be added to the cart
            const productIdToAdd = location.state?.addProductAfterLogin;
            if (productIdToAdd) {
              const productResponse = await fetch(`${API_URL}/products/${productIdToAdd}`);
              if (productResponse.ok) {
                const productToAdd = await productResponse.json();
                addToCart(productToAdd);
              }
            }

            closeModal();
            onNavigate('products'); // Navigate to products page
          } else {
            throw new Error('Failed to create user.');
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('An error occurred. Please try again.');
    }
  };
  return (
    <>
      <div className="welcome-screen">
        <div className="welcome-content">
          <h2>Welcome to My Shop!</h2>
          <p>The best place for society residents to buy and sell goods.</p>
          <div className="welcome-actions">
            <button className="btn btn-primary" onClick={() => openModal('login')}>Login</button>
            <button className="btn btn-secondary" onClick={() => openModal('signup')}>Sign Up</button>
          </div>
          <button className="btn btn-link" onClick={() => onNavigate('intro')}>See How It Works</button>
        </div>
      </div>
      <Modal isOpen={!!modalContent} onClose={closeModal}>
        {modalContent && <AuthForm formType={modalContent} onSubmit={handleAuthSubmit} />}
      </Modal>

    </>
  );
};

export default WelcomeScreen;