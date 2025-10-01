import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './UserManagementPage.css';

const UserManagementPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3001/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users.');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: newRole }),
      });
      if (!response.ok) throw new Error('Failed to update role.');

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, userType: newRole } : user
        )
      );
      alert('User role updated successfully!');
    } catch (err) {
      console.error('Role update error:', err);
      alert('Failed to update user role.');
    }
  };

  const handleVerificationToggle = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update verification status.');

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, isVerified: newStatus } : user
        )
      );
    } catch (err) {
      console.error('Verification update error:', err);
      alert('Failed to update verification status.');
    }
  };

  const handleBlockToggle = async (userId, currentBlockedStatus) => {
    const newBlockedStatus = !currentBlockedStatus;
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: newBlockedStatus }),
      });
      if (!response.ok) throw new Error('Failed to update block status.');

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, isBlocked: newBlockedStatus } : user
        )
      );
    } catch (err) {
      console.error('Block status update error:', err);
      alert('Failed to update block status.');
    }
  };

  if (!currentUser || currentUser.userType !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading users...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="user-management-container">
      <h1>User Management</h1>
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>
                  <select value={user.userType} onChange={(e) => handleRoleChange(user.id, e.target.value)} disabled={user.id === currentUser.id}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <label className="switch">
                    <input type="checkbox" checked={user.isVerified} onChange={() => handleVerificationToggle(user.id, user.isVerified)} disabled={user.id === currentUser.id} />
                    <span className="slider round"></span>
                  </label>
                </td>
                <td>
                  <button
                    className={`block-btn ${user.isBlocked ? 'unblock' : 'block'}`}
                    onClick={() => handleBlockToggle(user.id, user.isBlocked)}
                    disabled={user.id === currentUser.id}>
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;