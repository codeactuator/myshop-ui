import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useOutletContext } from 'react-router-dom';
import './TransactionManagementPage.css';

const TransactionManagementPage = () => {
  const { currentUser } = useAuth();
  const { orders: allOrders, deliveryPartners, handleManualAssign } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // For simplicity, we'll just use the orders data passed down.
        // A more robust solution might involve re-fetching enriched data here
        // or ensuring the parent passes down fully enriched data.
        if (allOrders) {
          setOrders(allOrders);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // 1. Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // 2. Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const buyerName = order.buyerInfo?.name?.toLowerCase() || '';
        return order.id.toLowerCase().includes(lowerCaseQuery) || buyerName.includes(lowerCaseQuery);
      });
    }
    return filtered;
  }, [orders, searchQuery, statusFilter]);

  const handleProcessRefund = async (orderId, refundDetails) => {
    if (window.confirm('Are you sure you want to process this refund? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:3001/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refund: {
              ...refundDetails,
              status: 'processed'
            }
          }),
        });
        if (!response.ok) throw new Error('Failed to process refund.');

        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, refund: { ...order.refund, status: 'processed' } } : order
          )
        );
        alert('Refund processed successfully!');
      } catch (err) {
        alert('Failed to process refund.');
      }
    }
  };

  if (!currentUser || currentUser.userType !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading transactions...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="transaction-management-container">
      <h1>Order Management</h1>
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search by Order ID or Buyer Name..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready_for_ship">Ready for Ship</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="transaction-table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Seller(s)</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Refund</th>
              <th>Assignment</th>
              <th>Dispute</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td><Link to={`/admin/dashboard/orders/${order.id}`}>#{order.id}</Link></td>
                <td>{order.buyerInfo?.name || 'N/A'}</td>
                <td className="seller-cell">
                  {order.sellers?.length === 1
                    ? (order.sellers[0].shopName || order.sellers[0].name)
                    : order.sellers?.length > 1
                      ? 'Multiple Sellers'
                      : 'N/A'}
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>${order.totalAmount.toFixed(2)}</td>
                <td>{order.paymentMethod?.toUpperCase() || 'N/A'}</td>
                <td><span className={`status-badge status-${order.status}`}>{order.status?.replace('_', ' ')}</span></td>
                <td>
                  {order.refund ? (
                    order.refund.status === 'requested' ? (
                      <button className="process-refund-btn" onClick={() => handleProcessRefund(order.id, order.refund)}>Process</button>
                    ) : (
                      <span className={`refund-status refund-${order.refund.status}`}>{order.refund.status}</span>
                    )
                  ) : ('N/A')}
                </td>
                <td>
                  {order.deliveryPartnerId ? (
                    deliveryPartners.find(p => p.id === order.deliveryPartnerId)?.name || 'Assigned'
                  ) : order.status === 'ready_for_ship' ? (
                    <div className="assignment-controls-table">
                      <select id={`partner-select-${order.id}`}>
                        <option value="">Select...</option>
                        {deliveryPartners.filter(p => p.isAvailable).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleManualAssign(order.id, document.getElementById(`partner-select-${order.id}`).value)}>Assign</button>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>
                  {order.dispute ? (<Link to="/admin/dashboard/reports" className="dispute-link">View</Link>) : ('N/A')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionManagementPage;