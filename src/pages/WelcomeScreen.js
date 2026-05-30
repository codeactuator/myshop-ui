import React, { useState } from 'react';
import './WelcomeScreen.css';

// Pull the URL from your .env file
const API_URL = process.env.REACT_APP_API_URL;

const WelcomeScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpModalVisible, setIsSignUpModalVisible] = useState(false);

  const handleContinue = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsLoading(true);
    try {
      // Hitting the backend endpoint that returns 404 if user doesn't exist
      const response = await fetch(`${API_URL}/users/by-phone/${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // HTTP 200: User exists
        const user = await response.json();
        console.log('User found:', user.name);
        navigation.navigate('LoginPassword', { user });
      } 
      else if (response.status === 404) {
        // HTTP 404: Trigger signup modal
        setIsSignUpModalVisible(true);
      } 
      else {
        alert('Server is temporarily unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('Connection Error:', error);
      alert('Network error. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      <h1>MyShop</h1>
      <p>Enter your phone number to get started</p>
      
      <input
        type="tel"
        placeholder="e.g. 8264481868"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="phone-input"
        disabled={isLoading}
      />

      <button 
        onClick={handleContinue} 
        disabled={isLoading} 
        className="continue-button"
      >
        {isLoading ? 'Checking...' : 'Continue'}
      </button>

      {/* Signup Modal triggered by 404 response */}
      {isSignUpModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Account Not Found</h3>
            <p>The number <b>{phoneNumber}</b> is not registered yet. Create an account?</p>
            
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setIsSignUpModalVisible(false);
                  navigation.navigate('SignUp', { phone: phoneNumber });
                }}
                className="signup-button"
              >
                Sign Up
              </button>
              <button 
                onClick={() => setIsSignUpModalVisible(false)} 
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
