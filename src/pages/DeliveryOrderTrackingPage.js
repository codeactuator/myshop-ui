import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrderTrackingPage.css'; // Re-using styles
import './DeliveryOrderTrackingPage.css'; // For specific overrides

const DeliveryOrderTrackingPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusSteps = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
  const statusDetails = {
    pending: 'Order placed, awaiting seller confirmation.',
    confirmed: 'Seller has confirmed the order.',
    preparing: 'Items are being prepared for pickup.',
    shipped: 'Order has been picked up and is on its way.',
    delivered: 'Order has been successfully delivered.'
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:3001/orders/${orderId}`);
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

    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="page-status">Loading order details...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;
  if (!order) return <div className="page-status">Order not found.</div>;

  const currentStatusIndex = statusSteps.indexOf(order.status);

  return (
    <div className="order-tracking-container">
      <Link to="/delivery/dashboard" className="dp-back-link">&larr; Back to Dashboard</Link>
      <h1>Order Details</h1>
      <div className="order-summary-header">
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Buyer:</strong> {order.buyerInfo.name}</p>
        <p><strong>Address:</strong> {order.buyerInfo.apartmentNumber}</p>
      </div>

      <div className="tracking-timeline">
        <h2>Order Status</h2>
        <div className="timeline">
          {statusSteps.map((step, index) => (
            <div key={step} className={`timeline-step ${index <= currentStatusIndex ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-label">{step}</div>
                <div className="timeline-detail">{statusDetails[step]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-contents">
        <h2>Items in this Order</h2>
        {order.items.map(item => (
          <div key={item.id} className="order-item-card">
            <img src={item.imageUrls[0]} alt={item.name} className="order-item-image" />
            <div className="order-item-info">
              <h4>{item.name} (x{item.quantity})</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveryOrderTrackingPage;