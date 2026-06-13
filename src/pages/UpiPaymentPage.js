import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './UpiPaymentPage.css';

const UpiPaymentPage = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // 1. Fetch Order to get amount and upiProvider
        const orderRes = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`);
        if (!orderRes.ok) throw new Error('Order not found');
        const orderData = await orderRes.json();
        setOrder(orderData);

        // 2. Fetch Seller details (using userId from the first item in the order)
        if (orderData.items && orderData.items.length > 0) {
          const sellerId = orderData.items[0].userId;
          const sellerRes = await fetch(`${process.env.REACT_APP_API_URL}/users/${sellerId}`);
          if (sellerRes.ok) {
            setSeller(await sellerRes.json());
          }
        }
      } catch (err) {
        console.error("Error loading payment info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [orderId]);

  const getTargetVpa = () => {
    if (!seller || !order) return 'platform@upi';
    if (order.upiProvider === 'gpay') return seller.gpayId || seller.paytmId || seller.phonepeId;
    if (order.upiProvider === 'paytm') return seller.paytmId || seller.gpayId || seller.phonepeId;
    if (order.upiProvider === 'phonepe') return seller.phonepeId || seller.gpayId || seller.paytmId;
    return 'platform@upi';
  };

  const vpa = getTargetVpa();
  const amount = order?.totalAmount || 0;
  const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(seller?.shopName || 'Seller')}&am=${amount}&cu=INR&tn=${encodeURIComponent('Order ' + orderId)}`;

  const handleOpenApp = () => {
    window.location.href = upiUrl;
  };

  const handlePaymentConfirmation = async () => {
    try {
      // In a real app, you'd verify payment status with your payment gateway.
      // Here, we'll just update the order status to 'pending'.
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING' }),
      });

      if (response.ok) {
        await clearCart();
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

  if (loading) return <div className="page-status">Initializing payment...</div>;

  return (
    <div className="upi-payment-container">
      <div className="upi-payment-card">
        <h2>Complete Your Payment</h2>
        <p className="payment-amount-display">Amount to Pay: <strong>₹{amount.toFixed(2)}</strong></p>
        
        {isMobile ? (
          <div className="mobile-payment-section">
            <p>Click the button below to open <strong>{order?.upiProvider?.toUpperCase()}</strong> and complete your payment.</p>
            <button className="btn btn-primary open-app-btn" onClick={handleOpenApp}>
              {order?.upiProvider === 'gpay' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" alt="" className="btn-upi-logo" />}
              {order?.upiProvider === 'paytm' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png" alt="" className="btn-upi-logo" />}
              {order?.upiProvider === 'phonepe' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png" alt="" className="btn-upi-logo" />}
              <span>
                Pay with {order?.upiProvider === 'gpay' ? 'Google Pay' : 
                          order?.upiProvider === 'paytm' ? 'Paytm' : 
                          order?.upiProvider === 'phonepe' ? 'PhonePe' : 'UPI App'}
              </span>
            </button>
          </div>
        ) : (
          <div className="desktop-payment-section">
            <p>Scan this QR code with your <strong>{order?.upiProvider?.toUpperCase()}</strong> app.</p>
            <div className="qr-code-placeholder">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`} 
                alt="Seller UPI QR Code" 
              />
            </div>
            <div className="vpa-display">
              <small>UPI ID: {vpa}</small>
            </div>
          </div>
        )}

        <p className="order-id-text">Your Order ID: {orderId}</p>
        <div className="payment-warning">
          <p>Please do not close this page until you have completed the payment in your UPI app.</p>
        </div>
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