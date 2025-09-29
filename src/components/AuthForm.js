import React, { useState } from 'react';
import './AuthForm.css';

const AuthForm = ({ formType, onSubmit, login }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('');
  const [apartment, setApartment] = useState('');
  const [userType, setUserType] = useState('buyer');

  const isSignUp = formType === 'signup';

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = isSignUp
      ? { mobileNumber, name, apartment, userType }
      : { mobileNumber };

    onSubmit(formData,login);
    // Here you would typically handle API calls
    alert(`${isSignUp ? 'Signing up' : 'Logging in'} with: ${JSON.stringify(formData)}`);
  };

  return (
    <div className="auth-form-container">
      <h2>{isSignUp ? 'Create Account' : 'Welcome Back!'}</h2>
      <p>{isSignUp ? 'Join our community marketplace.' : 'Log in to continue.'}</p>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="mobile">Mobile Number</label>
          <input
            type="tel"
            id="mobile"
            placeholder="e.g., 9876543210"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
          />
        </div>
        {isSignUp && (
          <div className="form-group">
            <label htmlFor="apartment">Apartment / Flat No.</label>
            <input
              type="text"
              id="apartment"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              required
            />
          </div>
        )}
        {isSignUp && (
          <div className="form-group">
            <label htmlFor="userType">Sign up as a</label>
            <select id="userType" value={userType} onChange={(e) => setUserType(e.target.value)} required>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
        )}

        <button type="submit" className="btn btn-primary auth-button">{isSignUp ? 'Sign Up' : 'Login'}</button>
      </form>
    </div>
  );
};

export default AuthForm;