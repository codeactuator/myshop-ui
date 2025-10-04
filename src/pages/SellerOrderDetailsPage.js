import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OrderTrackingPage.css'; // Re-using styles

const SellerOrderDetailsPage = () => {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusSteps = ['pending', 'confirmed', 'preparing', 'ready_for_ship', 'out_for_delivery', 'delivered', 'completed'];

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Order not found.');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) return <div className="page-status">Loading order details...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;
  if (!order) return <div className="page-status">Order not found.</div>;

  const currentStatusIndex = statusSteps.indexOf(order.status);
  const sellerItems = order.items.filter(item => item.userId === currentUser.id);

  return (
    <div className="order-tracking-container">
      <Link to="/seller/dashboard" className="back-link">&larr; Back to Dashboard</Link>
      <h1>Order Details</h1>
      <div className="order-summary-header">
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Buyer:</strong> {order.buyerInfo?.name || 'N/A'}</p>
        <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
      </div>

      <div className="tracking-timeline">
        <h2>Order Status</h2>
        <div className="timeline">
          {statusSteps.map((step, index) => (
            <div key={step} className={`timeline-step ${index <= currentStatusIndex ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-label">{step.replace('_', ' ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-contents">
        <h2>Your Items in this Order</h2>
        {sellerItems.map(item => (
          <div key={item.id} className="order-item-card" onClick={() => navigate(`/seller/products/${item.id}`)}>
            <img src={item.imageUrls[0]} alt={item.name} className="order-item-image" />
            <div className="order-item-info">
              <h4>{item.name}</h4>
              <p>Quantity: {item.quantity}</p>
              <p>Price: ${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerOrderDetailsPage;