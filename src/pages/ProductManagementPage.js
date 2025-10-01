import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import './ProductManagementPage.css';

const ProductManagementPage = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductsAndSellers = async () => {
      try {
        const [productsResponse, usersResponse] = await Promise.all([
          fetch('http://localhost:3001/products'),
          fetch('http://localhost:3001/users')
        ]);

        if (!productsResponse.ok || !usersResponse.ok) {
          throw new Error('Failed to fetch data.');
        }

        const productsData = await productsResponse.json();
        const usersData = await usersResponse.json();
        const usersMap = new Map(usersData.map(u => [u.id, u]));

        const productsWithSellers = productsData.map(product => ({
          ...product,
          seller: usersMap.get(product.userId)
        }));

        setProducts(productsWithSellers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndSellers();
  }, []);

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