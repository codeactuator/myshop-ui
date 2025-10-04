import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import './DeliveryPartnerDashboardPage.css';

const DeliveryPartnerDashboardPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  
  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'delivery_partner') return;

    const fetchData = async () => {
      try {
        // 1. Find the partner profile linked to the current user
        const partnersResponse = await fetch(`${process.env.REACT_APP_API_URL}/deliveryPartners?userId=${currentUser.id}`);
        if (!partnersResponse.ok) throw new Error('Could not fetch partner profile.');
        const partnersData = await partnersResponse.json();
        if (partnersData.length === 0) throw new Error('No delivery partner profile found for this user.');
        const profile = partnersData[0];
        setPartnerProfile(profile);

        // 2. Fetch orders assigned to this partner
        const ordersResponse = await fetch(`${process.env.REACT_APP_API_URL}/orders?deliveryPartnerId=${profile.id}&_sort=orderDate&_order=desc`);
        if (!ordersResponse.ok) throw new Error('Could not fetch assigned orders.');
        const ordersData = await ordersResponse.json();
        setAssignedOrders(ordersData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const activeOrders = useMemo(() => {
    return assignedOrders.filter(o => ['ready_for_ship', 'out_for_delivery'].includes(o.status));
  }, [assignedOrders]);

  const completedOrders = useMemo(() => {
    return assignedOrders.filter(o => o.status === 'delivered' || o.status === 'completed');
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
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const handleAvailabilityToggle = async () => {
    if (!partnerProfile) return;

    const newAvailability = !partnerProfile.isAvailable;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/deliveryPartners/${partnerProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newAvailability }),
      });
      if (!response.ok) throw new Error('Failed to update availability.');
      setPartnerProfile(prev => ({ ...prev, isAvailable: newAvailability }));
    } catch (err) {
      alert(err.message);
    }
  };
  if (!currentUser || currentUser.userType !== 'delivery_partner') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading your dashboard...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="dp-dashboard-container">
      <div className="dp-dashboard-header">
        <h1>Delivery Dashboard</h1>
        <div className="dp-header-actions">
          <div className="availability-toggle">
            <span className={`status-text ${partnerProfile?.isAvailable ? 'available' : 'unavailable'}`}>
              {partnerProfile?.isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <label className="switch"><input type="checkbox" checked={partnerProfile?.isAvailable || false} onChange={handleAvailabilityToggle} /><span className="slider round"></span></label>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </div>
      <p>Welcome, <strong>{currentUser.name}</strong>!</p>

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
                {order.status === 'ready_for_ship' && (
                    <button className="btn btn-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusUpdate(order.id, 'out_for_delivery'); }}>
                    Pick Up Order
                  </button>
                )}
                {order.status === 'out_for_delivery' && (
                    <button className="btn btn-success" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusUpdate(order.id, 'delivered'); }}>
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
          <button className="btn-toggle-completed" onClick={() => setShowCompleted(!showCompleted)}>
            {showCompleted ? 'Hide' : 'Show'}
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
  );
};

export default DeliveryPartnerDashboardPage;