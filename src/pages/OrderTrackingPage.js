import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import SafeImage from '../components/SafeImage';
import './OrderTrackingPage.css';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info', onConfirm: null });

  const showAlert = (message, type = 'info', onConfirm = null) => {
    setAlertModal({ isOpen: true, message, type, onConfirm });
  };
  const notificationSound = useRef(null);

  const statusSteps = ['pending', 'confirmed', 'preparing', 'ready_for_ship', 'out_for_delivery', 'delivered'];
  const statusDetails = {
    pending: 'Your order has been placed and is awaiting confirmation from the seller.',
    confirmed: 'The seller has confirmed your order.',
    preparing: 'Your items are being prepared for shipment.',
    'ready_for_ship': 'Your order is ready for the rider to pick up.',
    out_for_delivery: 'Your order is out for delivery.',
    delivered: 'Your order has been delivered. Enjoy!'
  };

  // Initialize the audio object once
  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    audio.onerror = () => console.error("Failed to load notification sound.");
    notificationSound.current = audio;
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      // Step 1: Fetch the basic order first
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Order not found.');
      }
      let data = await response.json();

      // Step 2: If a delivery partner is assigned, fetch its details
      if (data.deliveryPartnerId) {
        const partnerResponse = await fetch(`${process.env.REACT_APP_API_URL}/delivery/partners/${data.deliveryPartnerId}`);
        if (partnerResponse.ok) {
          const partnerData = await partnerResponse.json();
          data.deliveryPartner = partnerData;

          // Step 3: If the partner has a vehicle, fetch its details
          if (partnerData.vehicleId) {
            const vehicleResponse = await fetch(`${process.env.REACT_APP_API_URL}/delivery/vehicles/${partnerData.vehicleId}`);
            if (vehicleResponse.ok) {
              data.deliveryPartner.vehicle = await vehicleResponse.json();
            }
          }
        }
      }

      setOrder(prevOrder => {
        // Play sound if status has changed and it's not the initial load
        if (prevOrder && prevOrder.status !== data.status) {
          if (soundEnabled) {
            notificationSound.current.play().catch(e => console.error("Error playing sound:", e));
          }
        }
        return data; // Return the new state
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, soundEnabled]);

  useEffect(() => {
    fetchOrder();

    const handleSseNotification = () => {
      fetchOrder();
    };

    window.addEventListener('sse-notification', handleSseNotification);
    return () => {
      window.removeEventListener('sse-notification', handleSseNotification);
    };
  }, [fetchOrder]); // Re-run effect if fetchOrder changes

  if (loading) return <div className="page-status">Loading order details...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;
  if (!order) return <div className="page-status">Order not found.</div>;

  const handleEnableSound = () => {
    if (notificationSound.current) {
      notificationSound.current.muted = true;
      notificationSound.current.play()
        .then(() => {
          notificationSound.current.muted = false;
          setSoundEnabled(true);
          showAlert('Sound notifications for status updates are enabled!', 'success');
        })
        .catch(e => console.error("Could not enable sound:", e));
    }
  };

  const currentStatusIndex = statusSteps.indexOf(order.status?.toLowerCase());

  return (
    <>
    <div className="order-tracking-container">
      <Link to="/my-orders" className="back-link">&larr; Back to My Orders</Link>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        Order Details
        <button onClick={fetchOrder} title="Refresh status" style={{ background: 'none', border: 'none', color: '#5A189A', cursor: 'pointer', display: 'inline-flex', padding: 0 }}>
          <i className="fas fa-sync fa-lg"></i>
        </button>
      </h1>
      <div className="order-summary-header">
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
        <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</p>
      </div>

      {!soundEnabled && (
        <div className="sound-enable-banner">
          <p>Click to enable sound notifications for status updates.</p>
          <button className="btn btn-primary" onClick={handleEnableSound}>Enable Sound</button>
        </div>
      )}

      {order.deliveryPartner && (
        <div className="rider-info-card">
          <h2>Rider Information</h2>
          <div className="rider-details">
            <p><strong>Name:</strong> {order.deliveryPartner.name}</p>
            <p><strong>Phone:</strong> <a href={`tel:${order.deliveryPartner.phone}`}>{order.deliveryPartner.phone}</a></p>
            <p><strong>Vehicle:</strong> {order.deliveryPartner.vehicle ? `${order.deliveryPartner.vehicle.vehicleType} (${order.deliveryPartner.vehicle.vehicleNumber})` : 'N/A'}</p>
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
            <SafeImage src={item.imageUrls && item.imageUrls[0]} alt={item.name} className="order-item-image" />
            <div className="order-item-info">
              <h4>{item.name}</h4>
              <p>Quantity: {item.quantity}</p>
              <p>Price: ${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <Modal isOpen={alertModal.isOpen} onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}>
      <div className="alert-modal-content" style={{ textAlign: 'center' }}>
        <h2 style={{ color: alertModal.type === 'success' ? '#28a745' : alertModal.type === 'error' ? '#dc3545' : '#333', marginBottom: '1rem' }}>
          {alertModal.type === 'success' ? 'Success' : alertModal.type === 'error' ? 'Error' : 'Notification'}
        </h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#555' }}>{alertModal.message}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setAlertModal(prev => ({ ...prev, isOpen: false }));
            if (alertModal.onConfirm) alertModal.onConfirm();
          }}
        >
          OK
        </button>
      </div>
    </Modal>
    </>
  );
};

export default OrderTrackingPage;