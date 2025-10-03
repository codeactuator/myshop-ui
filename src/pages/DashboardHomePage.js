import React from 'react';
import { useOutletContext } from 'react-router-dom';

const DashboardHomePage = () => {
  const { users, products, orders, reports, totalRevenue, activeUsersCount } = useOutletContext();

  return (
    <div className="dashboard-summary">
      <div className="summary-card"><h3>Total Users</h3><p>{users.length}</p></div>
      <div className="summary-card"><h3>Total Listings</h3><p>{products.length}</p></div>
      <div className="summary-card"><h3>Active Users</h3><p>{activeUsersCount}</p></div>
      <div className="summary-card"><h3>Total Orders</h3><p>{orders.length}</p></div>
      <div className="summary-card"><h3>Total Revenue</h3><p>${totalRevenue.toFixed(2)}</p></div>
      <div className="summary-card"><h3>Open Reports</h3><p>{reports.length}</p></div>
    </div>
  );
};

export default DashboardHomePage;