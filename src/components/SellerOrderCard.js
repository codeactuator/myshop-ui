import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './SellerOrderCard.css';

const SellerOrderCard = ({ order, onUpdate }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Filter to show only items by the current seller
  const sellerItems = order.items.filter(item => item.userId === currentUser.id);

  const handleMarkAsReady = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready_for_ship' }),
      });
      if (!response.ok) throw new Error('Failed to update order status.');
      onUpdate(order.id, 'ready_for_ship');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (!response.ok) throw new Error('Failed to confirm order.');
      onUpdate(order.id, 'confirmed');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStartPreparing = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' }),
      });
      if (!response.ok) throw new Error('Failed to update order status.');
      onUpdate(order.id, 'preparing');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCardClick = () => {
    navigate(`/seller/orders/${order.id}`);
  };

  return (
    <div className="seller-order-card" onClick={handleCardClick}>
      <div className="seller-order-header">
        <h3>Order #{order.id}</h3>
        <span className={`status-badge status-${order.status}`}>{order.status.replace('_', ' ')}</span>
      </div>
      <div className="seller-order-details">
        <div className="order-section">
          <h4>Buyer Information</h4>
          <p><strong>Name:</strong> {order.buyerInfo.name}</p>
          <p><strong>Address:</strong> {order.buyerInfo.apartmentNumber}</p>
          <p><strong>Phone:</strong> {order.buyerInfo.phone}</p>
        </div>
        <div className="order-section">
          <h4>Your Items in this Order</h4>
          {sellerItems.map(item => (
            <div key={item.id} className="order-item-summary">
              <span>{item.name} (x{item.quantity})</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="seller-order-actions">
        {order.status === 'pending' && (<button className="btn btn-success" onClick={(e) => { e.stopPropagation(); handleConfirmOrder(); }}>Confirm Order</button>)}
        {order.status === 'confirmed' && (<button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleStartPreparing(); }}>Start Preparing</button>)}
        {order.status === 'preparing' && (<button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleMarkAsReady(); }}>Mark as Ready for Ship</button>)}
      </div>
    </div>
  );
};

export default SellerOrderCard;