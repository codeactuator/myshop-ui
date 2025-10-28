import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './ShopPage.css';

const ShopPage = () => {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShopData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Step 1: Fetch shop front details and user details in parallel
        const [shopFrontResponse, userResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/shop-front?sellerId=${sellerId}`),
          fetch(`${process.env.REACT_APP_API_URL}/users/${sellerId}`)
        ]);

        if (!shopFrontResponse.ok || !userResponse.ok) throw new Error('Shop not found.');
        
        const shopFrontData = await shopFrontResponse.json();
        const userData = await userResponse.json();
        const sellerData = { ...userData, ...shopFrontData }; // Combine both data sources
        setSeller(sellerData);

        // Step 2: Fetch available products for this seller
        const productsResponse = await fetch(`${process.env.REACT_APP_API_URL}/products?userId=${sellerId}&status=available`);
        if (!productsResponse.ok) throw new Error('Could not fetch products for this shop.');
        const productsData = await productsResponse.json();
        
        // Manually attach the seller data to each product for the ProductCard component
        const productsWithSeller = productsData.map(p => ({ ...p, user: sellerData }));
        setProducts(productsWithSeller);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [sellerId]);

  if (loading) return <div className="page-status">Loading shop...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;
  if (!seller) return <div className="page-status">Shop not found.</div>;

  return (
    <div className="shop-page-container">
      <div className="shop-header" style={{ backgroundImage: `url(${seller.bannerImageUrl || '/default-banner.jpg'})` }}>
        <div className="shop-header-overlay">
          <h1 className="shop-title">{seller.shopName || seller.name}</h1>
          {seller.shopTagline && <p className="shop-tagline">{seller.shopTagline}</p>}
          {seller.isVerified && <span className="shop-verified-badge-large"><i className="fas fa-check-circle"></i> Verified Seller</span>}
        </div>
      </div>
      <h2 className="shop-products-title">Products from this Shop</h2>
      <div className="product-grid">
        {products.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
};

export default ShopPage;