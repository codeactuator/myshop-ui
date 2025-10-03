import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useOutletContext } from 'react-router-dom';
import './ReportsPage.css';

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const { reports: allReports } = useOutletContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // 1. Fetch all reports
        // The parent AdminDashboardPage already fetches all necessary data.
        // For simplicity, we'll just use the reports data passed down.
        // A more robust solution might involve re-fetching enriched data here
        // or ensuring the parent passes down fully enriched data.
        if (allReports) {
          setReports(allReports);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [allReports]);

  if (!currentUser || currentUser.userType !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading reports...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="reports-container">
      <h1>User Reports</h1>
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Open Reports</h3><p>{reports.length}</p>
        </div>
      </div>
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