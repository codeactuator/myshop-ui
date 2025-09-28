import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <div className="order-success-container">
      <div className="order-success-content">
        <h2>Thank You For Your Order!</h2>
        <p>Your order has been placed successfully. You will be notified once the seller confirms it.</p>
        {orderId && <p className="order-id-confirmation">Your Order ID is: #{orderId}</p>}
        <div className="order-success-actions">
          {orderId && (
            <Link to={`/orders/${orderId}`} className="btn btn-secondary">Track Order</Link>
          )}
          <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;