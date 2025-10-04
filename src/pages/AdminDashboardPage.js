import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, Outlet, NavLink, useNavigate } from 'react-router-dom';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const { currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
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
          fetch(`${process.env.REACT_APP_API_URL}/users`),
          fetch(`${process.env.REACT_APP_API_URL}/orders`),
          fetch(`${process.env.REACT_APP_API_URL}/products`),
          fetch(`${process.env.REACT_APP_API_URL}/reports`),
          fetch(`${process.env.REACT_APP_API_URL}/deliveryPartners`),
        ]);

        if (!usersResponse.ok || !ordersResponse.ok || !productsResponse.ok || !reportsResponse.ok || !deliveryPartnersResponse.ok) {
          throw new Error('Failed to fetch dashboard data.');
        }

        const usersData = await usersResponse.json();
        const ordersData = await ordersResponse.json();
        const productsData = await productsResponse.json();
        const reportsData = await reportsResponse.json();
        const deliveryPartnersData = await deliveryPartnersResponse.json();

        // Enrich products with seller info
        const usersMap = new Map(usersData.map(u => [u.id, u]));
        const enrichedProducts = productsData.map(p => ({
          ...p,
          seller: usersMap.get(p.userId)
        }));

        // Enrich orders with seller(s) info
        const deliveryPartnersMap = new Map(deliveryPartnersData.map(p => [p.id, p]));
        const dummyPartner = { id: 'dummy', name: 'Unassigned' };
        const enrichedOrders = ordersData.map(order => { 
          const sellerIds = new Set(order.items?.map(item => item.userId).filter(Boolean));
          const finalOrder = {
            ...order,
            deliveryPartner: deliveryPartnersMap.get(order.deliveryPartnerId),
            sellers: [...sellerIds].map(id => usersMap.get(String(id))).filter(Boolean)
          };

          // If an order has no delivery partner, assign a dummy one for display purposes.
          if (!finalOrder.deliveryPartner) {
            finalOrder.deliveryPartner = dummyPartner;
          }

          return {
            ...finalOrder
          }; 
        });

        setUsers(usersData);
        setOrders(enrichedOrders);
        setProducts(enrichedProducts);
        setReports(reportsData);
        setDeliveryPartners(deliveryPartnersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling to refresh data every 15 seconds
    const interval = setInterval(fetchData, 15000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

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
    return orders.filter(order => order.status === 'ready_for_ship' && !order.deliveryPartnerId);
  }, [orders]);

  const partnerAvailability = useMemo(() => {
    return deliveryPartners.reduce((acc, partner) => {
      if (partner.isAvailable) {
        acc.available += 1;
      } else {
        acc.unavailable += 1;
      }
      return acc;
    }, { available: 0, unavailable: 0 });
  }, [deliveryPartners]);

  const ordersByStatus = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: Object.keys(statusCounts).map(s => s.replace('_', ' ')),
      data: Object.values(statusCounts),
    };
  }, [orders]);
  const handleManualAssign = async (orderId, partnerId) => {
    if (!partnerId) {
      alert('Please select a delivery partner.');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPartnerId: partnerId, status: 'out_for_delivery' }),
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

  const handleLogout = () => {
    logout();
    navigate('/welcome');
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
          <NavLink to="/admin/dashboard" end>Home</NavLink>
          <NavLink to="/admin/dashboard/users">Users</NavLink>
          <NavLink to="/admin/dashboard/products">Products</NavLink>
          <NavLink to="/admin/dashboard/orders">Orders</NavLink>
          <NavLink to="/admin/dashboard/delivery-fleet">Delivery Fleet</NavLink>
          <NavLink to="/admin/dashboard/reports">Reports</NavLink>
        </nav>
      </aside>
      <div className="admin-main-content">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
        <div className="admin-page-content">
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
            partnerAvailability,
            ordersByStatus
          }} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;