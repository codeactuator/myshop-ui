import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import SellerOrderCard from '../components/SellerOrderCard';
import Modal from '../components/Modal';
import './SellerDashboardPage.css';

const SellerDashboardPage = () => {
  const { currentUser } = useAuth();
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info', onConfirm: null });

  const showAlert = (message, type = 'info', onConfirm = null) => {
    setAlertModal({ isOpen: true, message, type, onConfirm });
  };
  const notificationSound = useRef(null);

  // Initialize the audio object once
  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    audio.onerror = () => {
      // This will trigger if the file can't be found or loaded.
      console.error("Failed to load notification sound. Ensure 'notification.mp3' is in the 'public' folder.");
    };
    notificationSound.current = audio;
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.userType?.toLowerCase() !== 'seller') {
      setLoading(false);
      return;
    }

    const checkForNewOrders = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders.');
        const allOrders = await response.json();

        const myOrders = allOrders.filter(order =>
          order.items && order.items.some(item => Number(item.userId) === currentUser.id)
        ).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        // Check against localStorage to see if there are new orders
        const notifiedOrders = JSON.parse(localStorage.getItem(`notifiedOrders_${currentUser.id}`) || '[]');
        const newOrders = myOrders.filter(order => !notifiedOrders.includes(order.id));

        if (newOrders.length > 0) {
          if (soundEnabled) {
            notificationSound.current.play().catch(e => console.error("Error playing sound:", e));
          }
          
          // Update notified orders in localStorage
          const newNotifiedIds = [...notifiedOrders, ...newOrders.map(o => o.id)];
          localStorage.setItem(`notifiedOrders_${currentUser.id}`, JSON.stringify(newNotifiedIds));
        }

        setSellerOrders(myOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkForNewOrders(); // Initial fetch

    const handleSseNotification = () => {
      checkForNewOrders();
    };

    window.addEventListener('sse-notification', handleSseNotification);
    return () => {
      window.removeEventListener('sse-notification', handleSseNotification);
    };
  }, [currentUser]);

  const handleOrderStatusUpdate = (orderId, newStatus) => {
    setSellerOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus.toUpperCase() } : order
      )
    );
  };

  const handleEnableSound = () => {
    // This user interaction is required by browsers to allow audio to play.
    if (notificationSound.current) {
      notificationSound.current.muted = true;
      notificationSound.current.play()
        .then(() => {
          notificationSound.current.muted = false;
          setSoundEnabled(true);
          showAlert('Sound notifications enabled!', 'success');
          // Sound is enabled, no need for an alert unless there's an error.
        })
        .catch(e => console.error("Could not enable sound:", e));
    }
  };

  if (!currentUser || currentUser.userType?.toLowerCase() !== 'seller') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading your dashboard...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <>
    <div className="seller-dashboard-container">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <Link to="/seller/inventory" className="btn btn-secondary">Manage Inventory</Link>
      </div>
      {!soundEnabled && (
        <div className="sound-enable-banner">
          <p>Click to enable sound notifications for new orders.</p>
          <button className="btn btn-primary" onClick={handleEnableSound}>Enable Sound</button>
        </div>
      )}
      <h2>Your Orders</h2>
      {sellerOrders.length > 0 ? (
        sellerOrders.map(order => <SellerOrderCard key={order.id} order={order} onUpdateStatus={handleOrderStatusUpdate} />)
      ) : (
        <p>You have no orders yet.</p>
      )}
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

export default SellerDashboardPage;