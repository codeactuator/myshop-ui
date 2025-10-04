import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        // Step 1: Fetch all orders for the current user
        const ordersResponse = await fetch(`${process.env.REACT_APP_API_URL}/orders?userId=${currentUser.id}`);
        if (!ordersResponse.ok) {
          throw new Error('Failed to fetch orders.');
        }
        const ordersData = await ordersResponse.json();

        // Step 2: Get all unique seller IDs from all items in the orders
        const sellerIds = [...new Set(ordersData.flatMap(order => order.items.map(item => item.userId)).filter(Boolean))];

        if (sellerIds.length === 0) {
          setOrders(ordersData.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)));
          return;
        }

        // Step 3: Fetch all unique sellers
        const usersResponse = await fetch(`${process.env.REACT_APP_API_URL}/users?${sellerIds.map(id => `id=${id}`).join('&')}`);
        if (!usersResponse.ok) throw new Error('Failed to fetch seller information.');
        const usersData = await usersResponse.json();
        const usersMap = new Map(usersData.map(user => [user.id, user]));

        // Step 4: Filter out orders where all items are from blocked sellers
        const validOrders = ordersData.filter(order => 
          order.items.some(item => usersMap.get(item.userId) && !usersMap.get(item.userId).isBlocked)
        );

        setOrders(validOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'active') {
      return orders.filter(o => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled');
    }
    if (statusFilter === 'completed') {
      return orders.filter(o => o.status === 'delivered' || o.status === 'completed');
    }
    // 'all'
    return orders;
  }, [orders, statusFilter]);

  if (loading) return <div className="page-status">Loading your orders...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="my-orders-container">
      <h1>My Orders</h1>

      <div className="order-filters">
        <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All Orders</button>
        <button className={statusFilter === 'active' ? 'active' : ''} onClick={() => setStatusFilter('active')}>Active</button>
        <button className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter('completed')}>Completed</button>
      </div>

      {filteredOrders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
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