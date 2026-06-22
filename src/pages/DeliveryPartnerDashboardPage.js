import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import Modal from '../components/Modal';
import './DeliveryPartnerDashboardPage.css';

const DeliveryPartnerDashboardPage = () => {
  const { currentUser } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info', onConfirm: null });

  const showAlert = (message, type = 'info', onConfirm = null) => {
    setAlertModal({ isOpen: true, message, type, onConfirm });
  };
  const notificationSound = useRef(null);
  const isInitialLoad = useRef(true);

  // Initialize the audio object once
  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    audio.onerror = () => console.error("Failed to load notification sound.");
    notificationSound.current = audio;
  }, []);
  
  const fetchData = useCallback(async () => {
    try {
      // 1. Find the partner profile linked to the current user
      const partnersResponse = await fetch(`${process.env.REACT_APP_API_URL}/delivery/partners?userId=${currentUser.id}`);
      if (!partnersResponse.ok) throw new Error('Could not fetch partner profile.');
      const partnersData = await partnersResponse.json();
      if (partnersData.length === 0) throw new Error('No delivery partner profile found for this user.');
      const profile = partnersData[0];
      setPartnerProfile(profile);

      // 2. Fetch orders assigned to this partner
      const ordersResponse = await fetch(`${process.env.REACT_APP_API_URL}/orders?deliveryPartnerId=${profile.id}`);
      if (!ordersResponse.ok) throw new Error('Could not fetch assigned orders.');
      const ordersData = await ordersResponse.json();

      // Check for new orders to trigger notification
      setAssignedOrders(prevOrders => {
        if (!isInitialLoad.current && ordersData.length > prevOrders.length) { // Check if it's not the initial load
          if (soundEnabled) {
            notificationSound.current.play().catch(e => console.error("Error playing sound:", e));
          }
          showAlert('A new order has been assigned to you!', 'success');
        }
        isInitialLoad.current = false;
        return ordersData.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      });

    } catch (err) {
      // Only set error if it's a new error, to avoid flickering on poll failures
      setError(currentError => {
        if (currentError !== err.message) return err.message;
        return currentError;
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, soundEnabled]);

  useEffect(() => {
    if (!currentUser || currentUser.userType?.toLowerCase() !== 'delivery_partner') return;

    fetchData();

    const handleSseNotification = () => {
      fetchData();
    };

    window.addEventListener('sse-notification', handleSseNotification);
    return () => {
      window.removeEventListener('sse-notification', handleSseNotification);
    };
  }, [currentUser, fetchData]);

  const activeOrders = useMemo(() => {
    return assignedOrders.filter(o => ['READY_FOR_SHIP', 'OUT_FOR_DELIVERY'].includes(o.status));
  }, [assignedOrders]);

  const completedOrders = useMemo(() => {
    return assignedOrders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED');
  }, [assignedOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update order status.');
      const updatedOrder = await response.json();
      setAssignedOrders(orders => orders.map(o => o.id === orderId ? updatedOrder : o));
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!partnerProfile) return;

    const newAvailability = !partnerProfile.available;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delivery/partners/${partnerProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newAvailability }),
      });
      if (!response.ok) throw new Error('Failed to update availability.');
      const updatedPartner = await response.json();
      setPartnerProfile(updatedPartner);
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const handleEnableSound = () => {
    if (notificationSound.current) {
      notificationSound.current.muted = true;
      notificationSound.current.play()
        .then(() => {
          notificationSound.current.muted = false;
          setSoundEnabled(true);
          showAlert('Sound notifications enabled!', 'success');
        })
        .catch(e => console.error("Could not enable sound:", e));
    }
  };
  if (!currentUser || currentUser.userType?.toLowerCase() !== 'delivery_partner') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading your dashboard...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <>
    <div className="dp-dashboard-container">
      <div className="dp-dashboard-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          Delivery Dashboard
          <button onClick={fetchData} title="Refresh status" style={{ background: 'none', border: 'none', color: '#5A189A', cursor: 'pointer', display: 'inline-flex', padding: 0 }}>
            <i className="fas fa-sync fa-lg"></i>
          </button>
        </h1>
        <div className="dp-header-actions">
          <div className="availability-toggle">
            <span className={`status-text ${partnerProfile?.available ? 'available' : 'unavailable'}`}>
              {partnerProfile?.available ? 'Available' : 'Unavailable'}
            </span>
            <label className="switch"><input type="checkbox" checked={partnerProfile?.available || false} onChange={handleAvailabilityToggle} /><span className="slider round"></span></label>
          </div>
        </div>
      </div>
      <p>Welcome, <strong>{currentUser.name}</strong>!</p>

          {!soundEnabled && (
            <div className="sound-enable-banner">
              <p>Click to enable sound notifications for new orders.</p>
              <button className="btn btn-primary" onClick={handleEnableSound}>Enable Sound</button>
            </div>
          )}

          <div className="dp-orders-list">
            <h2>Active Deliveries</h2>
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <Link key={order.id} to={`/delivery/orders/${order.id}`} className="dp-order-card-link">
                  <div className="dp-order-card">
                    <div className="dp-order-info">
                      <h3>Order #{order.id}</h3>
                      <p><strong>Buyer:</strong> {order.buyerInfo.name}</p>
                      <p><strong>Address:</strong> {order.buyerInfo.apartmentNumber}</p>
                      <p><strong>Phone:</strong> {order.buyerInfo.phone}</p>
                      <p><strong>Status:</strong> <span className={`status-badge status-${order.status}`}>{order.status.replace('_', ' ')}</span></p>
                    </div>
                    <div className="dp-order-actions">
                      {order.status === 'READY_FOR_SHIP' && (
                        <button className="btn btn-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusUpdate(order.id, 'OUT_FOR_DELIVERY'); }}>
                          Pick Up Order
                        </button>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button className="btn btn-success" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusUpdate(order.id, 'DELIVERED'); }}>
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p>You have no active deliveries right now.</p>
            )}
          </div>

          <div className="dp-orders-list completed-deliveries">
            <div className="completed-header">
              <h2>Completed Deliveries ({completedOrders.length})</h2>
              <button className="btn btn-secondary" onClick={() => setShowCompleted(!showCompleted)}>
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </button>
            </div>
            {showCompleted && (
              <div className="completed-orders-grid">
                {completedOrders.length > 0 ? (
                  completedOrders.map(order => (
                    <Link key={order.id} to={`/delivery/orders/${order.id}`} className="dp-order-card-link">
                      <div className="dp-order-card dp-order-card-completed">
                        <h3>Order #{order.id}</h3>
                        <p><span className={`status-badge status-${order.status}`}>{order.status}</span></p>
                      </div>
                    </Link>
                  ))
                ) : <p>No completed deliveries to show.</p>}
              </div>
            )}
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

export default DeliveryPartnerDashboardPage;