import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMessage } from '../context/MessageContext';
import './UpiPaymentPage.css';

const UpiPaymentPage = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [order, setOrder] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Checks order status to see if the backend has updated it (via webhook/IPN callback)
  const checkOrderStatus = async () => {
    try {
      const orderRes = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`);
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrder(orderData);
        
        const activeStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_SHIP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
        if (activeStatuses.includes(orderData.status?.toUpperCase())) {
          await clearCart();
          navigate(`/orders/${orderId}`);
        } else if (orderData.status?.toUpperCase() === 'CANCELLED') {
          showMessage('Payment Session Expired', 'This payment session has expired or the order was cancelled.');
          navigate('/products');
        }
      }
    } catch (err) {
      console.error("Error verifying payment status:", err);
    }
  };

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
          const [sellerRes, shopFrontRes] = await Promise.all([
            fetch(`${process.env.REACT_APP_API_URL}/users/${sellerId}`),
            fetch(`${process.env.REACT_APP_API_URL}/shop-front?sellerId=${sellerId}`)
          ]);

          if (sellerRes.ok) {
            const sellerData = await sellerRes.json();
            let shopFrontData = {};
            if (shopFrontRes.ok) {
              const sfData = await shopFrontRes.json();
              shopFrontData = Array.isArray(sfData) ? sfData[0] : sfData;
            }
            setSeller({ ...sellerData, ...shopFrontData });
          }
        }
      } catch (err) {
        console.error("Error loading payment info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();

    // 1. Listen for real-time changes via Server-Sent Events (SSE)
    const handleSseNotification = () => {
      checkOrderStatus();
    };
    window.addEventListener('sse-notification', handleSseNotification);

    // 2. Fallback polling (every 4 seconds) in case mobile browser suspends background connections
    const pollInterval = setInterval(checkOrderStatus, 4000);

    return () => {
      window.removeEventListener('sse-notification', handleSseNotification);
      clearInterval(pollInterval);
    };
  }, [orderId, checkOrderStatus]);

  const getTargetVpa = () => {
    if (!seller || !order) return 'platform@upi';
    const upiProviderLower = order.upiProvider?.toLowerCase();
    const providers = {
      gpay: [seller.gpayId, seller.paytmId, seller.phonepeId],
      paytm: [seller.paytmId, seller.gpayId, seller.phonepeId],
      phonepe: [seller.phonepeId, seller.gpayId, seller.paytmId]
    };
    const priorityList = providers[upiProviderLower] || [seller.gpayId, seller.paytmId, seller.phonepeId];
    const resolvedVpa = priorityList.find(id => id && id.trim() !== '');
    return resolvedVpa || 'platform@upi';
  };

  const vpa = getTargetVpa();
  const amount = order?.totalAmount || 0;
  const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(seller?.payeeName || seller?.shopName || 'Seller')}&am=${amount}&cu=INR&tn=${encodeURIComponent('Order ' + orderId)}`;
  console.log(upiUrl);
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
      showMessage('Error', 'An error occurred while confirming your payment. Please try again.');
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
              {order?.upiProvider?.toLowerCase() === 'gpay' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" alt="" className="btn-upi-logo" />}
              {order?.upiProvider?.toLowerCase() === 'paytm' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png" alt="" className="btn-upi-logo" />}
              {order?.upiProvider?.toLowerCase() === 'phonepe' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png" alt="" className="btn-upi-logo" />}
              <span>
                Pay with {order?.upiProvider?.toLowerCase() === 'gpay' ? 'Google Pay' : 
                          order?.upiProvider?.toLowerCase() === 'paytm' ? 'Paytm' : 
                          order?.upiProvider?.toLowerCase() === 'phonepe' ? 'PhonePe' : 'UPI App'}
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