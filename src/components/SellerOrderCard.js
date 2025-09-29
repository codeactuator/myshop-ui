import React from 'react';
import './SellerOrderCard.css';

const SellerOrderCard = ({ order, sellerItems, onUpdateStatus }) => {
  const { buyerInfo, fulfillmentMethod, paymentMethod, status } = order;

  return (
    <div className="seller-order-card">
      <div className="seller-order-header">
        <h3>Order #{order.id}</h3>
        <span className={`status-badge status-${status}`}>{status.replace('_', ' ')}</span>
      </div>
      <div className="seller-order-details">
        <div className="order-section">
          <h4>Items to Fulfill</h4>
          {sellerItems.map(item => (
            <div key={item.id} className="order-item-summary">
              <span>{item.name} (x{item.quantity})</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="order-section">
          <h4>Buyer Information</h4>
          <p><strong>Name:</strong> {buyerInfo.name}</p>
          {fulfillmentMethod === 'delivery' && <p><strong>Address:</strong> {buyerInfo.apartmentNumber}</p>}
          <p><strong>Fulfillment:</strong> {fulfillmentMethod}</p>
          <p><strong>Payment:</strong> {paymentMethod.toUpperCase()}</p>
        </div>
      </div>
      <div className="seller-order-actions">
        {status === 'pending' && (
          <button className="btn btn-primary" onClick={() => onUpdateStatus(order.id, 'confirmed')}>
            Confirm Order
          </button>
        )}
        {status === 'confirmed' && (
          <button className="btn btn-primary" onClick={() => onUpdateStatus(order.id, 'preparing')}>
            Start Preparing
          </button>
        )}
      </div>
    </div>
  );
};

export default SellerOrderCard;