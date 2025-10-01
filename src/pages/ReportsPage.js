import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import './ReportsPage.css';

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // 1. Fetch all reports
        const reportsResponse = await fetch('http://localhost:3001/reports?_sort=date&_order=desc');
        if (!reportsResponse.ok) throw new Error('Failed to fetch reports.');
        const reportsData = await reportsResponse.json();

        // 2. Get all unique user and product IDs from the reports
        const userIds = new Set();
        reportsData.forEach(r => {
          userIds.add(r.reportedUserId);
          userIds.add(r.reportedByUserId);
        });
        const productIds = new Set(reportsData.map(r => r.productId));

        // 3. Fetch all related users and products in parallel
        const [usersResponse, productsResponse] = await Promise.all([
          fetch(`http://localhost:3001/users?${[...userIds].map(id => `id=${id}`).join('&')}`),
          fetch(`http://localhost:3001/products?${[...productIds].map(id => `id=${id}`).join('&')}`)
        ]);

        const usersData = await usersResponse.json();
        const productsData = await productsResponse.json();

        // 4. Create maps for easy lookup
        const usersMap = new Map(usersData.map(u => [u.id, u]));
        const productsMap = new Map(productsData.map(p => [p.id, p]));

        // 5. Combine data
        const enrichedReports = reportsData.map(report => ({
          ...report,
          reportedUser: usersMap.get(report.reportedUserId),
          reporter: usersMap.get(report.reportedByUserId),
          product: productsMap.get(report.productId),
        }));

        setReports(enrichedReports);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (!currentUser || currentUser.userType !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading reports...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="reports-container">
      <h1>User Reports</h1>
      <div className="reports-list">
        {reports.map(report => (
          <div key={report.id} className="report-card">
            <div className="report-card-header">
              <span>Reported: <strong>{report.reportedUser?.name || 'N/A'}</strong></span>
              <span>By: <strong>{report.reporter?.name || 'N/A'}</strong></span>
              <span>{new Date(report.date).toLocaleString()}</span>
            </div>
            <div className="report-card-body">
              <p><strong>Reason:</strong> {report.reason}</p>
              {report.product && (
                <p><strong>Related Product:</strong> <Link to={`/products/${report.product.id}`}>{report.product.name}</Link></p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;