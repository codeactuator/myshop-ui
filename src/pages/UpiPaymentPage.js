import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './UpiPaymentPage.css';

const UpiPaymentPage = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handlePaymentConfirmation = async () => {
    // The order status is already 'pending'. We just need to clear the cart and navigate.
    clearCart();
    // Pass orderId to the success page
    navigate('/order-success', { state: { orderId: orderId } });
  };

  return (
    <div className="upi-payment-container">
      <div className="upi-payment-card">
        <h2>Complete Your Payment</h2>
        <p>Scan the QR code with your favorite UPI app to complete the transaction.</p>
        <div className="qr-code-placeholder">
          {/* This now points to a generic, platform-level UPI address */}
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=platform@my-shop" 
            alt="Platform UPI QR Code" 
          />
        </div>
        <p className="order-id-text">Your Order ID: {orderId}</p>
        <button 
          className="btn btn-primary confirm-payment-btn" 
          onClick={handlePaymentConfirmation}
        >
          I Have Paid
        </button>
      </div>
    </div>
  );
};

export default UpiPaymentPage;