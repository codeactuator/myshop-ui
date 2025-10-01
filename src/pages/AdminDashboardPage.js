import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, Outlet, NavLink } from 'react-router-dom';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, ordersResponse, productsResponse, reportsResponse] = await Promise.all([
          fetch('http://localhost:3001/users'),
          fetch('http://localhost:3001/orders'),
          fetch('http://localhost:3001/products'),
          fetch('http://localhost:3001/reports')
        ]);

        if (!usersResponse.ok || !ordersResponse.ok || !productsResponse.ok || !reportsResponse.ok) {
          throw new Error('Failed to fetch dashboard data.');
        }

        const usersData = await usersResponse.json();
        const ordersData = await ordersResponse.json();
        const productsData = await productsResponse.json();
        const reportsData = await reportsResponse.json();

        setUsers(usersData);
        setOrders(ordersData);
        setProducts(productsData);
        setReports(reportsData);
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
        <h1>Admin Dashboard</h1>
        <div className="dashboard-summary">
          <div className="summary-card"><h3>Total Users</h3><p>{users.length}</p></div>
          <div className="summary-card"><h3>Total Listings</h3><p>{products.length}</p></div>
          <div className="summary-card"><h3>Active Users</h3><p>{activeUsersCount}</p></div>
          <div className="summary-card"><h3>Total Orders</h3><p>{orders.length}</p></div>
          <div className="summary-card"><h3>Total Revenue</h3><p>${totalRevenue.toFixed(2)}</p></div>
          <div className="summary-card"><h3>Open Reports</h3><p>{reports.length}</p></div>
        </div>
        <Outlet />
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Popular Categories</h2>
            <ul className="admin-list">
              {popularCategories.map(cat => (
                <li key={cat.name}><span>{cat.name}</span><span>{cat.count} listings</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;