import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import './WelcomeScreen.css';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showMessage } = useMessage();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // Steps: 'phone', 'signup', 'otp'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;
  const HARDCODED_OTP = '1111';

  // Step 1: Check if user exists by phone
  const handleContinue = async () => {
    if (phone.length < 10) {
      showMessage('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/by-phone/${phone}`);
      if (response.ok) {
        setIsExistingUser(true); // User exists, go to OTP for Login
        setStep('otp');
      } else if (response.status === 404) {
        setIsExistingUser(false); // User doesn't exist, go straight to OTP for Signup
        setStep('otp');
      } else {
        showMessage('Server Error', 'Server is temporarily busy. Please try again later.');
      }
    } catch (error) {
      // Log the full error to help identify Mixed Content or DNS issues on mobile
      showMessage('Network Error', `Unable to reach server. Error: ${error.message}. API Path: ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP and finalize Login/Signup
  const handleVerifyOtp = async () => {
    if (otp !== HARDCODED_OTP) {
      showMessage('Invalid OTP', 'The code you entered is incorrect. For testing, use 1111.');
      return;
    }

    setLoading(true);
    try {
      if (isExistingUser) {
        // Fetch user info to finalize login
        const response = await fetch(`${API_URL}/users/by-phone/${phone}`);
        const user = await response.json();
        console.log('User Logged In:', user);

        // Determine landing page based on role
        const landingPage = user.userType?.toUpperCase() === 'DELIVERY_PARTNER' ? '/delivery/dashboard' : '/products';

        login(user);
        showMessage('Welcome', `Welcome back, ${user.name}!`, () => {
          navigate(landingPage); 
        });
      } else {
        // Register new user
        const response = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            name: '', // Name will be filled out on the /profile page
            email: '',
            userType: 'BUYER',
          }),
        });

        if (response.ok) {
          const newUser = await response.json();
          console.log('User Registered:', newUser);

          // Determine landing page based on role
          const landingPage = newUser.userType?.toUpperCase() === 'DELIVERY_PARTNER' ? '/delivery/dashboard' : '/products';

          login(newUser);
          showMessage('Success', `Account created successfully for ${newUser.phone}!`, () => {
            navigate(landingPage);
          });
        } else {
          const errorData = await response.json();
          showMessage('Signup Failed', errorData.error || 'Registration could not be completed.');
        }
      }
    } catch (error) {
      showMessage('Auth Error', 'Authentication process failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      <h1>hungrynow</h1>

      {step === 'phone' && (
        <div className="phone-step">
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>Get started with your phone number</p>
          <input
            className="phone-input"
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button className="continue-button" onClick={handleContinue} disabled={loading}>
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Verification</h3>
            <p>Enter the 4-digit code sent to {phone}</p>
            <p><small>(Use 1111 for testing)</small></p>
            <input
              className="phone-input otp-display"
              type="text"
              maxLength="4"
              placeholder="0000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setStep('phone')}>Back</button>
              <button className="signup-button primary-purple" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;