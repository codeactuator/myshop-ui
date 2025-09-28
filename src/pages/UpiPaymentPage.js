import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './UpiPaymentPage.css';

const UpiPaymentPage = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handlePaymentConfirmation = async () => {
    try {
      // In a real app, you'd verify payment status with your payment gateway.
      // Here, we'll just update the order status to 'pending'.
      const response = await fetch(`http://localhost:3001/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });

      if (response.ok) {
        clearCart();
        // Pass orderId to the success page
        navigate('/order-success', { state: { orderId: orderId } });
      } else {
        throw new Error('Failed to confirm payment.');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('An error occurred while confirming your payment. Please try again.');
    }
  };

  return (
    <div className="upi-payment-container">
      <div className="upi-payment-card">
        <h2>Complete Your Payment</h2>
        <p>Scan the QR code with your favorite UPI app to complete the transaction.</p>
        <div className="qr-code-placeholder">
          {/* In a real app, you would generate and display a QR code here */}
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=example@upi" 
            alt="UPI QR Code" 
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