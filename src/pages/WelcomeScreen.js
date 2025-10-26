import React, { useState } from 'react';
import './WelcomeScreen.css';
import Modal from '../components/Modal';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';


const WelcomeScreen = ({ onNavigate }) => {

 const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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
      const { mobileNumber: phone, ...rest } = formData;

      if (formType === 'login') {
        const response = await fetch(`${API_URL}/users/by-phone/${phone}`);
        if (response.ok) {
          const user = await response.json();
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
          if (user.userType?.toLowerCase() === 'admin') {
            navigate('/admin/dashboard');
          } else if (user.userType?.toLowerCase() === 'delivery_partner') {
            navigate('/delivery/dashboard');
          } else if (user.userType?.toLowerCase() === 'seller') {
            navigate('/seller/dashboard');
          } else {
            navigate('/products');
          }
        } else {
          if (response.status === 404) {
            alert('No user found with this mobile number. Please sign up.');
          } else {
            throw new Error('Login failed. Please try again.');
          }
        }
      } else if (formType === 'signup') {
        // Create new user
        const newUser = { phone, ...rest };
        // Spring Boot expects 'apartmentNumber' not 'apartment'
        if (newUser.apartment) {
          newUser.apartmentNumber = newUser.apartment;
          delete newUser.apartment;
        }
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
            navigate('/products');
          } else {
            throw new Error('Failed to create user.');
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