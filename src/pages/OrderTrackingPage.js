import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './OrderTrackingPage.css';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const statusSteps = ['pending', 'confirmed', 'preparing', 'ready_for_ship', 'out_for_delivery', 'delivered'];
  const statusDetails = {
    pending: 'Your order has been placed and is awaiting confirmation from the seller.',
    confirmed: 'The seller has confirmed your order.',
    preparing: 'Your items are being prepared for shipment.',
    ready_for_ship: 'Your order is ready for the rider to pick up.',
    out_for_delivery: 'Your order is out for delivery.',
    delivered: 'Your order has been delivered. Enjoy!'
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}?_expand=deliveryPartner&_embed=deliveryVehicles`);
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

  // Define dummy rider info for orders in 'shipped' or later stages without a real assigned partner
  const dummyRider = {
    name: 'Alex Ray',
    phone: '555-012-3456',
    vehicle: {
      vehicleType: 'Bike',
      vehicleNumber: 'UP32 XY 5678'
    }
  };

  // Determine which rider info to show. If status is shipped or later, show dummy info if no real partner exists.
  const riderInfo = order.deliveryPartner || (currentStatusIndex >= 4 ? dummyRider : null);

  return (
    <div className="order-tracking-container">
      <Link to="/my-orders" className="back-link">&larr; Back to My Orders</Link>
      <h1>Order Details</h1>
      <div className="order-summary-header">
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
        <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</p>
      </div>

      {riderInfo && (
        <div className="rider-info-card">
          <h2>Rider Information</h2>
          <div className="rider-details">
            <p><strong>Name:</strong> {riderInfo.name}</p>
            <p><strong>Phone:</strong> <a href={`tel:${riderInfo.phone}`}>{riderInfo.phone}</a></p>
            <p><strong>Vehicle:</strong> {riderInfo.vehicle ? `${riderInfo.vehicle.vehicleType} (${riderInfo.vehicle.vehicleNumber})` : 'N/A'}</p>
          </div>
        </div>
      )}

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
          <div key={item.id} className="order-item-card" onClick={() => navigate(`/products/${item.id}`)}>
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

export default OrderTrackingPage;