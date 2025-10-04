import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useOutletContext } from 'react-router-dom';
import './ProductManagementPage.css';

const ProductManagementPage = () => {
  const { currentUser } = useAuth();
  const { products: allProducts, popularCategories } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  const categories = useMemo(() => {
    if (!allProducts) return [];
    const allCats = allProducts.map(p => p.category || 'Uncategorized');
    return ['all', ...Array.from(new Set(allCats)).sort()];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let tempProducts = products;

    // 1. Filter by category
    if (categoryFilter !== 'all') {
      tempProducts = tempProducts.filter(product => (product.category || 'Uncategorized') === categoryFilter);
    }

    // 2. Filter by search query
    if (searchQuery) {
      tempProducts = tempProducts.filter(product => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const productName = product.name.toLowerCase();
        const sellerName = (product.seller?.shopName || product.seller?.name || '').toLowerCase();
        return productName.includes(lowerCaseQuery) || sellerName.includes(lowerCaseQuery);
      });
    }
    return tempProducts;
  }, [products, searchQuery, categoryFilter]);

  const handleStatusToggle = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/products/${productId}`, {
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
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search by Product or Seller Name..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
          ))}
        </select>
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
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td><Link to={`/admin/dashboard/products/${product.id}`}>{product.name}</Link></td>
                <td>{product.seller?.shopName || product.seller?.name || 'N/A'}</td>
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