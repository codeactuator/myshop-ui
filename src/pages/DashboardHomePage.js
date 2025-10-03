import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardHomePage = () => {
  const { users, products, orders, reports, totalRevenue, activeUsersCount, partnerAvailability, ordersByStatus, popularCategories } = useOutletContext() || {};

  const doughnutChartData = {
    labels: ordersByStatus?.labels || [],
    datasets: [
      {
        label: '# of Orders',
        data: ordersByStatus?.data || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(199, 199, 199, 0.5)',
          'rgba(83, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const categoryChartData = {
    labels: popularCategories?.map(c => c.name) || [],
    datasets: [
      {
        label: '# of Listings',
        data: popularCategories?.map(c => c.count) || [],
        backgroundColor: [
          'rgba(123, 44, 191, 0.5)',
          'rgba(214, 93, 177, 0.5)',
          'rgba(255, 111, 145, 0.5)',
          'rgba(255, 150, 113, 0.5)',
          'rgba(255, 199, 95, 0.5)',
        ],
        borderColor: [
          'rgba(123, 44, 191, 1)',
          'rgba(214, 93, 177, 1)',
          'rgba(255, 111, 145, 1)',
          'rgba(255, 150, 113, 1)',
          'rgba(255, 199, 95, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <div className="dashboard-summary">
        <div className="summary-card"><h3>Total Users</h3><p>{users?.length || 0}</p></div>
        <div className="summary-card"><h3>Total Listings</h3><p>{products?.length || 0}</p></div>
        <div className="summary-card"><h3>Active Users</h3><p>{activeUsersCount || 0}</p></div>
        <div className="summary-card"><h3>Available Partners</h3><p>{partnerAvailability?.available || 0}</p></div>
        <div className="summary-card"><h3>Unavailable Partners</h3><p>{partnerAvailability?.unavailable || 0}</p></div>
        <div className="summary-card"><h3>Total Orders</h3><p>{orders?.length || 0}</p></div>
        <div className="summary-card"><h3>Total Revenue</h3><p>${totalRevenue?.toFixed(2) || '0.00'}</p></div>
        <div className="summary-card"><h3>Open Reports</h3><p>{reports?.length || 0}</p></div>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-card chart-card">
          <h2>Orders by Status</h2>
          <Doughnut data={doughnutChartData} />
        </div>
        <div className="dashboard-card chart-card">
          <h2>Top 5 Categories</h2>
          <Doughnut data={categoryChartData} />
        </div>
      </div>
    </>
  );
};

export default DashboardHomePage;