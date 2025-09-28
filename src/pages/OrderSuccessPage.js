import React from 'react';
import { Link } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  return (
    <div className="order-success-container">
      <div className="order-success-content">
        <h2>Thank You For Your Order!</h2>
        <p>Your order has been placed successfully. You will be notified once the seller confirms it.</p>
        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;