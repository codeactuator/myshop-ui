import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './InventoryPage.css';

const InventoryPage = () => {
  const { currentUser } = useAuth();
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const fetchMyProducts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/products?userId=${currentUser.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch your products.');
        }
        const data = await response.json();
        setMyProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, [currentUser]);

  const handleStatusToggle = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status.');

      setMyProducts(prevProducts =>
        prevProducts.map(p => (p.id === productId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error('Status update error:', err);
      alert('Failed to update product status.');
    }
  };

  const handleCardClick = (productId) => {
    // Navigate to the public product details page for preview
    navigate(`/products/${productId}`);
  };

  if (loading) return <div className="page-status">Loading inventory...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>My Inventory</h1>
        <Link to="/seller/add-product" className="btn btn-primary">
          + Add New Product
        </Link>
      </div>
      {myProducts.length === 0 ? (
        <p>You have not listed any products yet.</p>
      ) : (
        <div className="inventory-list">
          {myProducts.map(product => (
            <div key={product.id} className="inventory-item-card" onClick={() => handleCardClick(product.id)}>
              <img src={product.imageUrls[0]} alt={product.name} className="inventory-item-image" />
              <div className="inventory-item-info">
                <span className="inventory-item-name">{product.name}</span>
                <div className="inventory-item-actions" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/seller/edit-product/${product.id}`} className="edit-btn">Edit</Link>
                  <label className="switch">
                    <input type="checkbox" checked={product.status === 'available'} onChange={() => handleStatusToggle(product.id, product.status)} />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;