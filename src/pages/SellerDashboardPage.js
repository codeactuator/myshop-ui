import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import SellerOrderCard from '../components/SellerOrderCard';
import './SellerDashboardPage.css';

const SellerDashboardPage = () => {
  const { currentUser } = useAuth();
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'seller') {
      setLoading(false);
      return;
    }

    const fetchSellerOrders = async () => {
      try {
        // Fetch all orders and filter for those containing the seller's items
        const response = await fetch('http://localhost:3001/orders');
        if (!response.ok) throw new Error('Failed to fetch orders.');
        const allOrders = await response.json();

        const myOrders = allOrders.filter(order =>
          order.items && order.items.some(item => item.userId === currentUser.id)
        );

        setSellerOrders(myOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerOrders();
  }, [currentUser]);

  const handleOrderStatusUpdate = (orderId, newStatus) => {
    setSellerOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  if (!currentUser || currentUser.userType !== 'seller') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading your dashboard...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="seller-dashboard-container">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <Link to="/seller/inventory" className="btn btn-secondary">Manage Inventory</Link>
      </div>
      <h2>Your Orders</h2>
      {sellerOrders.length > 0 ? (
        sellerOrders.map(order => <SellerOrderCard key={order.id} order={order} onUpdate={handleOrderStatusUpdate} />)
      ) : (
        <p>You have no orders yet.</p>
      )}
    </div>
  );
};

export default SellerDashboardPage;