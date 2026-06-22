import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { Navigate, Outlet } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar'; // Keep AdminNavbar for top bar
import AdminSideNavbar from '../components/AdminSideNavbar';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const { currentUser } = useAuth();
  const { showMessage } = useMessage();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [usersResponse, ordersResponse, productsResponse, reportsResponse, deliveryPartnersResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/users`).catch(e => ({ ok: false, error: e })),
        fetch(`${process.env.REACT_APP_API_URL}/orders`).catch(e => ({ ok: false, error: e })),
        fetch(`${process.env.REACT_APP_API_URL}/products`).catch(e => ({ ok: false, error: e })),
        fetch(`${process.env.REACT_APP_API_URL}/reports`).catch(e => ({ ok: false, error: e })),
        fetch(`${process.env.REACT_APP_API_URL}/delivery/partners`).catch(e => ({ ok: false, error: e })),
      ]);

      // Check responses individually or handle partial failures
      const usersData = usersResponse.ok ? await usersResponse.json() : [];
      const ordersData = ordersResponse.ok ? await ordersResponse.json() : [];
      const productsData = productsResponse.ok ? await productsResponse.json() : [];
      const reportsData = reportsResponse.ok ? await reportsResponse.json() : [];
      const deliveryPartnersData = deliveryPartnersResponse.ok ? await deliveryPartnersResponse.json() : [];

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
  }, []);

  useEffect(() => {
    fetchData();

    const handleSseNotification = () => {
      fetchData();
    };

    window.addEventListener('sse-notification', handleSseNotification);
    return () => {
      window.removeEventListener('sse-notification', handleSseNotification);
    };
  }, [fetchData]);

  const refreshOrders = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders.');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = useMemo(() => {
    return orders
      .filter(order => order.status === 'DELIVERED' || order.status === 'COMPLETED')
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
    return orders.filter(order => order.status === 'PENDING' && !order.deliveryPartnerId);
  }, [orders]);

  const handleManualAssign = async (orderId, partnerId) => {
    if (!partnerId) {
      showMessage('Selection Required', 'Please select a delivery partner.');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPartnerId: partnerId, status: 'READY_FOR_SHIP' }),
      });
      if (!response.ok) throw new Error('Failed to assign order.');
      const updatedOrder = await response.json();
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      showMessage('Success', `Order ${orderId} assigned to partner ${partnerId}.`);
    } catch (err) {
      showMessage('Assignment Error', err.message);
    }
  };

  const handleAutoAssign = (orderId) => {
    const availablePartners = deliveryPartners.filter(p => p.available);
    if (availablePartners.length === 0) {
      showMessage('No Partners', 'No delivery partners are available right now.');
      return;
    }

    const sortedPartners = [...availablePartners].sort((a, b) => a.activeDeliveries - b.activeDeliveries);
    const bestPartner = sortedPartners[0];

    if (bestPartner) {
      handleManualAssign(orderId, bestPartner.id);
    } else {
      showMessage('Error', 'Could not determine the best partner to assign.');
    }
  };

  if (!currentUser || currentUser.userType?.toLowerCase() !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading Admin Dashboard...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="admin-dashboard-layout">
      <AdminNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onRefresh={fetchData} />
      <div className="admin-dashboard-container">
        <AdminSideNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
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
            activeUsersCount,
            refreshOrders,
            fetchData
          }} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;