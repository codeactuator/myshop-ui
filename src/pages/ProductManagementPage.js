import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useOutletContext } from 'react-router-dom';
import './ProductManagementPage.css';

const ProductManagementPage = () => {
  const { currentUser } = useAuth();
  const { products: allProducts, popularCategories } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductsAndSellers = async () => {
      try {
        // Data is now coming from the parent route context
        setProducts(allProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndSellers();
  }, [allProducts]);

  const handleStatusToggle = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      const response = await fetch(`http://localhost:3001/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status.');

      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === productId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      alert('Failed to update product status.');
    }
  };

  if (!currentUser || currentUser.userType !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading products...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="product-management-container">
      <h1>Product Management</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card">
            <h2>Popular Categories</h2>
            {popularCategories && popularCategories.length > 0 ? (
              <ul className="admin-list">
                {popularCategories.map(cat => (
                  <li key={cat.name}>
                    <span>{cat.name}</span>
                    <span>{cat.count} listings</span>
                  </li>
                ))}
              </ul>
            ) : <p>No category data available.</p>
            }
        </div>
      </div>
      <div className="product-table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td><Link to={`/products/${product.id}`}>{product.name}</Link></td>
                <td>{product.seller?.name || 'N/A'}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>
                  <label className="switch">
                    <input type="checkbox" checked={product.status === 'available'} onChange={() => handleStatusToggle(product.id, product.status)} />
                    <span className="slider round"></span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagementPage;