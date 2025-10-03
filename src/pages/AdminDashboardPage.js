import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, Outlet, NavLink } from 'react-router-dom';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, ordersResponse, productsResponse, reportsResponse, deliveryPartnersResponse] = await Promise.all([
          fetch('http://localhost:3001/users'),
          fetch('http://localhost:3001/orders'),
          fetch('http://localhost:3001/products'),
          fetch('http://localhost:3001/reports'),
          fetch('http://localhost:3001/deliveryPartners'),
        ]);

        if (!usersResponse.ok || !ordersResponse.ok || !productsResponse.ok || !reportsResponse.ok || !deliveryPartnersResponse.ok) {
          throw new Error('Failed to fetch dashboard data.');
        }

        const usersData = await usersResponse.json();
        const ordersData = await ordersResponse.json();
        const productsData = await productsResponse.json();
        const reportsData = await reportsResponse.json();
        const deliveryPartnersData = await deliveryPartnersResponse.json();

        setUsers(usersData);
        setOrders(ordersData);
        setProducts(productsData);
        setReports(reportsData);
        setDeliveryPartners(deliveryPartnersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenue = useMemo(() => {
    return orders
      .filter(order => order.status === 'delivered' || order.status === 'completed')
      .reduce((acc, order) => acc + order.totalAmount, 0);
  }, [orders]);

  const activeUsersCount = useMemo(() => {
    const userIdsWithOrders = new Set(orders.map(order => order.userId));
    return userIdsWithOrders.size;
  }, [orders]);

  const popularCategories = useMemo(() => {
    if (products.length === 0) return [];
    const categoryCounts = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5 categories
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  const unassignedOrders = useMemo(() => {
    return orders.filter(order => order.status === 'pending' && !order.deliveryPartnerId);
  }, [orders]);

  const handleManualAssign = async (orderId, partnerId) => {
    if (!partnerId) {
      alert('Please select a delivery partner.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPartnerId: partnerId, status: 'preparing' }),
      });
      if (!response.ok) throw new Error('Failed to assign order.');
      const updatedOrder = await response.json();
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      alert(`Order ${orderId} assigned to partner ${partnerId}.`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAutoAssign = (orderId) => {
    // Simple auto-assign logic: find the available partner with the fewest active deliveries.
    const availablePartners = deliveryPartners.filter(p => p.isAvailable);
    if (availablePartners.length === 0) {
      alert('No delivery partners are available right now.');
      return;
    }

    // Sort by workload (ascending), then by a random factor to distribute evenly
    const sortedPartners = [...availablePartners].sort((a, b) => {
      if (a.activeDeliveries < b.activeDeliveries) return -1;
      if (a.activeDeliveries > b.activeDeliveries) return 1;
      return Math.random() - 0.5;
    });

    const bestPartner = sortedPartners[0];

    // In a real app, you'd also consider location.
    // For now, we just assign to the one with the least workload.
    if (bestPartner) {
      handleManualAssign(orderId, bestPartner.id);
    } else {
      alert('Could not determine the best partner to assign.');
    }
  };

  // Protect this route
  if (!currentUser || currentUser.userType !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading Admin Dashboard...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="admin-dashboard-container">
      <aside className="admin-sidebar">
        <nav>
          <NavLink to="/admin/dashboard/users">Users</NavLink>
          <NavLink to="/admin/dashboard/products">Products</NavLink>
          <NavLink to="/admin/dashboard/transactions">Transactions</NavLink>
          <NavLink to="/admin/dashboard/delivery-fleet">Delivery Fleet</NavLink>
          <NavLink to="/admin/dashboard/reports">Reports</NavLink>
        </nav>
      </aside>
      <div className="admin-main-content">
        <Outlet context={{
          users,
          orders,
          setOrders,
          products,
          reports,
          deliveryPartners,
          unassignedOrders,
          handleManualAssign,
          handleAutoAssign,
          popularCategories,
          totalRevenue,
          activeUsersCount
        }} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;