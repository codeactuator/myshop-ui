import React, { useState, useEffect, useMemo, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import './ProductListingPage.css';

const ProductListingPage = () => {
  const [products, setProducts] = useState([]); // Holds the original, unfiltered list of products
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Step 1: Fetch all available products
        const productsResponse = await fetch('http://localhost:3001/products?status=available');
        if (!productsResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const productsData = await productsResponse.json();

        // Step 2: Get all unique seller IDs from the products
        const sellerIds = [...new Set(productsData.map(p => p.userId))];

        // Step 3: Fetch all unique sellers in a single request
        const usersResponse = await fetch(`http://localhost:3001/users?${sellerIds.map(id => `id=${id}`).join('&')}`);
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch seller information.');
        }
        const usersData = await usersResponse.json();
        const usersMap = new Map(usersData.map(user => [user.id, user]));

        // Step 4: Combine products with seller info and filter out products from blocked users
        const productsWithSellers = productsData
          .map(product => ({
            ...product,
            user: usersMap.get(product.userId)
          }))
          .filter(product => product.user && !product.user.isBlocked);

        setProducts(productsWithSellers);
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
    });

    return Array.from(uniqueSuggestions).slice(0, 7); // Limit to 7 suggestions
  }, [searchQuery, products]);

  // Filter products based on the search query
  const filteredProducts = useMemo(() =>
    products.filter(product => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery)
      );
    }), [products, searchQuery]);

  if (loading) return <div className="page-status">Loading products...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="product-listing-container">
      <h1 className="page-title">Community Marketplace</h1>
      <div className="search-bar-container" ref={searchContainerRef}>
        <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder="Search by product name or category..."
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
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductListingPage;