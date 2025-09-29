import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import SellerOrderCard from '../components/SellerOrderCard';
import './SellerDashboardPage.css';
import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

const SellerDashboardPage = () => {
  const { currentUser } = useAuth();

  const [allOrders, setAllOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await fetch('http://localhost:3001/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders.');
        }
        const data = await response.json();
        setAllOrders(data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);

  const sellerOrders = useMemo(() => {
    if (!currentUser) return [];
    return allOrders
      .map(order => {
        const sellerItems = order.items.filter(item => item.userId === currentUser.id);
        return sellerItems.length > 0 ? { ...order, sellerItems } : null;
      })
      .filter(Boolean); // Remove null entries
  }, [allOrders, currentUser]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status.');

      // Update local state to reflect the change immediately
      setAllOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="page-status">Loading dashboard...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="seller-dashboard-container">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <Link to="/seller/add-product" className="btn btn-primary">
          + Add New Product
        </Link>
      </div>
      <h2>Incoming Orders</h2>
      {sellerOrders.length === 0 ? (
        <p>You have no incoming orders.</p>
      ) : (
        sellerOrders.map(order => (
          <SellerOrderCard key={order.id} order={order} sellerItems={order.sellerItems} onUpdateStatus={handleUpdateStatus} />
        ))
      )}
    </div>
  );
};

export default SellerDashboardPage;