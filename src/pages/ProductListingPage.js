import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import './ProductListingPage.css'; // This import is now correct

const ProductListingPage = () => {
  const [products, setProducts] = useState([]); // Holds the original, unfiltered list of products
  const [sellers, setSellers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // This import is now correct
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'shops'
  const [error, setError] = useState(null);
  const searchContainerRef = useRef(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const productsResponse = await fetch(`${API_URL}/products?status=available`);
        if (!productsResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const productsData = await productsResponse.json();
        console.log(productsData);
        
        // Step 2: Get all unique seller IDs from the products
        const sellerIds = [...new Set(productsData.map(p => p.userId).filter(id => id))];
        console.log(sellerIds);

        if (sellerIds.length > 0) {
          // Step 3: Fetch all unique sellers in a single request
          const usersResponse = await fetch(`${API_URL}/users?ids=${sellerIds.join(',')}`);
          if (!usersResponse.ok) {
            console.error('Failed to fetch seller information, displaying products without seller details.');
            setProducts(productsData); // Fallback: show products without seller info
            return;
          }
          const usersData = await usersResponse.json();
          const usersMap = new Map(usersData.map(user => [user.id, user]));

          // Step 3.5: Fetch shop front data for these sellers
          const shopFrontsResponse = await fetch(`${API_URL}/shop-front/batch?sellerIds=${sellerIds.join(',')}`);
          let shopFrontsMap = new Map();
          if (shopFrontsResponse.ok) {
            const shopFrontsData = await shopFrontsResponse.json();
            shopFrontsMap = new Map(shopFrontsData.map(sf => [sf.sellerId, sf]));
          }

          const enrichedSellers = usersData.map(user => ({ ...user, ...shopFrontsMap.get(user.id) }));
          setSellers(enrichedSellers.filter(u => !u.isBlocked));

          // Step 4: Combine products with seller info and filter out products from blocked or non-existent sellers
          const productsWithSellers = productsData
            .map(product => ({
              ...product,
              user: usersMap.get(Number(product.userId))
            }))
            .filter(product => product.user && !product.user.isBlocked); // Ensure user exists and is not blocked

          setProducts(productsWithSellers);
        } else {
          // If there are no sellers to fetch, just set the products
          setProducts(productsData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle clicks outside the search container to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate suggestions based on the search query
  const suggestions = useMemo(() => {
    if (searchQuery.length === 0) return [];

    const lowerCaseQuery = searchQuery.toLowerCase();
    const uniqueSuggestions = new Set();

    products.forEach(product => {
      if (product.name.toLowerCase().includes(lowerCaseQuery)) {
        uniqueSuggestions.add(product.name);
      }
      if (product.category.toLowerCase().includes(lowerCaseQuery)) {
        uniqueSuggestions.add(product.category);
      }
      if (product.user?.name?.toLowerCase().includes(lowerCaseQuery)) {
        uniqueSuggestions.add(product.user.name);
      }
      if (product.user?.shopName?.toLowerCase().includes(lowerCaseQuery)) {
        uniqueSuggestions.add(product.user.shopName);
      }
    });

    return Array.from(uniqueSuggestions).slice(0, 7); // Limit to 7 suggestions
  }, [searchQuery, products]);

  // Filter products based on the search query
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery) ||
        (product.user?.name?.toLowerCase().includes(lowerCaseQuery)) ||
        (product.user?.shopName?.toLowerCase().includes(lowerCaseQuery))
      );
    });
    return filtered;
  }, [products, searchQuery]);

  // Filter shops based on the search query
  const filteredShops = useMemo(() => {
    if (!searchQuery) return sellers;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return sellers.filter(seller =>
      (seller.name?.toLowerCase().includes(lowerCaseQuery)) ||
      (seller.shopName?.toLowerCase().includes(lowerCaseQuery))
    );
  }, [sellers, searchQuery]);

  if (loading) return <div className="page-status">Loading products...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="product-listing-container">
      <div className="search-bar-container" ref={searchContainerRef}>
        <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder={activeTab === 'products' ? "Search by product, category, or seller..." : "Search by shop or seller name..."}
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item" onClick={() => { setSearchQuery(suggestion); setShowSuggestions(false); }}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="view-tabs">
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          Products
        </button>
        <button className={`tab-btn ${activeTab === 'shops' ? 'active' : ''}`} onClick={() => setActiveTab('shops')}>
          Shops
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="shop-grid">
          {filteredShops.map((seller) => {
            const sellerProducts = products.filter(p => Number(p.userId) === seller.id);
            return <ShopCard key={seller.id} seller={seller} products={sellerProducts} />;
          })}
        </div>
      )}
    </div>
  );
};

export default ProductListingPage;