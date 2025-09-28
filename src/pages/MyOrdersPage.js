import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://localhost:3001/orders?userId=${currentUser.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders.');
        }
        const data = await response.json();
        setOrders(data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))); // Sort by most recent
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  if (loading) return <div className="page-status">Loading your orders...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="my-orders-container">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <Link to={`/orders/${order.id}`} key={order.id} className="order-card-link">
              <div className="order-card">
                <div className="order-card-header">
                  <span>Order ID: {order.id}</span>
                  <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                <div className="order-card-body">
                  <p>Total: <strong>${order.totalAmount.toFixed(2)}</strong></p>
                  <p>Status: <span className={`status-badge status-${order.status || 'pending'}`}>{(order.status || 'pending').replace('_', ' ')}</span></p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;