import React, { useState } from 'react';
import './WelcomeScreen.css';
import Modal from '../components/Modal';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


const WelcomeScreen = ({ onNavigate }) => {

 const API_URL = 'http://localhost:3001';

  const openModal = (type) => setModalContent(type);
  const closeModal = () => setModalContent(null);
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState(null); // 'login' or 'signup'
  const { login } = useAuth();

  const handleAuthSubmit = async (formData) => {
    const formType = modalContent;
    try {
      const { mobileNumber, ...rest } = formData;
      // Check if user exists
      const response = await fetch(`${API_URL}/users?phone=${mobileNumber}`);
      const existingUsers = await response.json();

      if (formType === 'login') {
        if (existingUsers.length > 0) {
          alert(`Welcome back, ${existingUsers[0].name}!`);
          login(existingUsers[0]);
          closeModal();
          onNavigate('products'); // Navigate to products page
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