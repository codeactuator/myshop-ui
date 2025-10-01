import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import './TransactionManagementPage.css';

const TransactionManagementPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const [ordersResponse, usersResponse, reportsResponse] = await Promise.all([
          fetch('http://localhost:3001/orders?_sort=orderDate&_order=desc'),
          fetch('http://localhost:3001/users'),
          fetch('http://localhost:3001/reports')
        ]);

        if (!ordersResponse.ok || !usersResponse.ok || !reportsResponse.ok) {
          throw new Error('Failed to fetch transaction data.');
        }

        const ordersData = await ordersResponse.json();
        const usersData = await usersResponse.json();
        const reportsData = await reportsResponse.json();
        const usersMap = new Map(usersData.map(u => [u.id, u]));
        const reportsMap = new Map(reportsData.map(r => [r.id, r]));

        const enrichedOrders = ordersData.map(order => ({
          ...order,
          buyer: usersMap.get(order.userId),
          dispute: order.reportId ? reportsMap.get(order.reportId) : null
        }));

        setOrders(enrichedOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

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
      <h1>Transaction Management</h1>
      <div className="transaction-table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Refund</th>
              <th>Dispute</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.buyer?.name || 'N/A'}</td>
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