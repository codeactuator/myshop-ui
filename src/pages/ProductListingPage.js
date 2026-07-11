import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'shops'
  const [error, setError] = useState(null);
  const [loadingShops, setLoadingShops] = useState(false);
  const searchContainerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    setProducts([]);
    setPage(0);
    setHasMore(true);
    setIsFallbackMode(false);
  }, [currentUser]);

  // Fetch shops strictly on demand when user activates the Shops tab or search query updates
  useEffect(() => {
    if (activeTab === 'shops') {
      fetchShops();
    }
  }, [activeTab, searchQuery, currentUser]);

  useEffect(() => {
    if (activeTab !== 'products') return;
    const fetchProducts = async () => {
      if (!hasMore) return;
      try {
        // Dispatch Progress: Fetch started (20%)
        window.dispatchEvent(new CustomEvent('app-loading-progress', { detail: { progress: 20 } }));

        if (page === 0) setLoading(true);
        else setLoadingMore(true);

        const API_URL = process.env.REACT_APP_API_URL;
        const activeSocietyId = currentUser?.buyerSociety?.id || currentUser?.societyId;
        let targetSocietyId = activeSocietyId || 0;

        // If we previously entered fallback mode, keep loading page updates from the fallback list (societyId=0)
        if (isFallbackMode) {
          targetSocietyId = 0;
        }

        let url = `${API_URL}/products?status=available&page=${page}&size=10&societyId=${targetSocietyId}`;

        let productsResponse = await fetch(url);
        // Dispatch Progress: Main product list fetched (50%)
        window.dispatchEvent(new CustomEvent('app-loading-progress', { detail: { progress: 50 } }));

        if (!productsResponse.ok) {
          throw new Error('Network response was not ok');
        }
        let productsData = await productsResponse.json();
        
        // Dispatch Progress: Initial parse complete (70%)
        window.dispatchEvent(new CustomEvent('app-loading-progress', { detail: { progress: 70 } }));
        
        // Fallback Trigger: If the user's chosen society has no products, fetch from other societies (societyId=0)
        if (productsData.length === 0 && page === 0 && activeSocietyId) {
          setIsFallbackMode(true);
          const fallbackUrl = `${API_URL}/products?status=available&page=0&size=10&societyId=0`;
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            productsData = await fallbackResponse.json();
          }
        }
        
        if (productsData.length < 10) {
          setHasMore(false);
        }

        // Dispatch Progress: Mapping active seller profiles (90%)
        window.dispatchEvent(new CustomEvent('app-loading-progress', { detail: { progress: 90 } }));

        setProducts(prev => [...prev, ...productsData.map(product => ({
          ...product,
          // Fallback mappings directly resolved on server-side aggregated payload
          user: {
            id: product.userId,
            name: product.sellerName || "Local Seller",
            shopName: product.shopName,
            isVerified: product.isVerifiedSeller,
            profileImageUrl: product.sellerProfileImageUrl
          },
          hideAddToCart: isFallbackMode || !activeSocietyId,
          isFallback: isFallbackMode
        }))]);
      } catch (err) {
        setError(err.message);
      } finally {
        // Dispatch Progress: Layout loaded & DOM painted (100%)
        window.dispatchEvent(new CustomEvent('app-loading-progress', { detail: { progress: 100 } }));

        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchProducts();
  }, [currentUser, page, isFallbackMode, hasMore]);

  const fetchShops = async () => {
    setLoadingShops(true);
    try {
      const activeSocietyId = currentUser?.buyerSociety?.id || currentUser?.societyId || 0;
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/shop-front/search?societyId=${activeSocietyId}&query=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSellers(data.map(sf => ({
          ...sf,
          id: sf.userId,
          name: sf.payeeName || sf.shopName
        })));
      }
    } catch (err) {
      console.error("Failed to load shop listings:", err);
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1.0 }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [loading, hasMore, loadingMore]);

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
    return products.filter(product => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery) ||
        (product.user?.name?.toLowerCase().includes(lowerCaseQuery)) ||
        (product.user?.shopName?.toLowerCase().includes(lowerCaseQuery))
      );
    });
  }, [products, searchQuery]);

  // Filter shops based on the search query
  const filteredShops = useMemo(() => sellers, [sellers]);

  if (loading) {
    return (
      <div className="page-status-container" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontFamily: "'Poppins', sans-serif"
      }}>
        <style>{`
          @keyframes page-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div className="page-loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #5A189A',
          borderRadius: '50%',
          animation: 'page-spin 1s linear infinite',
          marginBottom: '1.5rem'
        }}></div>
        <h3 style={{ color: '#5A189A', fontWeight: '600', margin: 0 }}>Gathering fresh products...</h3>
        <p style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '0.5rem' }}>Please wait while we set up the storefront.</p>
      </div>
    );
  }
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="product-listing-container">
      {/* Mobile-first Responsive CSS Injection for 2 columns on Mobile screens */}
      <style>{`
        @media (max-width: 767px) {
          .product-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            padding: 5px !important;
            align-items: stretch !important;
          }
          .product-card {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
          }
          .product-card .product-info {
            flex-grow: 1 !important;
            padding: 8px !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .product-card .product-name {
            font-size: 0.9rem !important;
          }
          .product-card .product-price,
          .product-card .seller-info {
            margin-top: 2px !important;
            margin-bottom: 2px !important;
          }
          .product-card .add-to-cart-btn,
          .product-card .contact-seller-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. Call to Action Banner if user has not selected their society */}
      {(!currentUser?.buyerSociety?.id && !currentUser?.societyId) && (
        <div className="society-warning-banner" style={{
          backgroundColor: '#FFF3CD',
          color: '#856404',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #FFEBAA',
          fontSize: '0.95rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Please select your residential society to view delivery-supported products near you.</span>
          <Link to="/profile" style={{
            color: '#5A189A',
            fontWeight: 'bold',
            textDecoration: 'underline',
            marginLeft: '8px'
          }}>
            Go to Profile
          </Link>
        </div>
      )}

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

      {/* 2. Warning message below the search field if the chosen society has no products */}
      {isFallbackMode && (
        <div className="fallback-warning-message" style={{
          backgroundColor: '#E2E3E5',
          color: '#383D41',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          borderLeft: '4px solid #5A189A',
          fontWeight: '500'
        }}>
          <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#5A189A' }}></i>
          There are no products listed in your society yet. Showing items from other societies in read-only mode.
        </div>
      )}

      <div className="view-tabs">
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          Products
        </button>
        <button className={`tab-btn ${activeTab === 'shops' ? 'active' : ''}`} onClick={() => setActiveTab('shops')}>
          Shops
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={product.isFallback ? "fallback-readonly-wrapper" : ""}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          {hasMore && (
            <div ref={loadMoreRef} className="load-more-trigger" style={{ height: '20px', margin: '20px 0' }}>
              {loadingMore && <p style={{ textAlign: 'center', color: '#5A189A' }}>Loading more amazing products...</p>}
            </div>
          )}
        </>
      ) : (
        <div className="shop-grid">
          {loadingShops ? (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#5A189A', padding: '2rem' }}>Loading stores...</p>
          ) : filteredShops.length === 0 ? (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#6c757d', padding: '2rem' }}>No shops service your society yet.</p>
          ) : filteredShops.map((seller) => {
            return <ShopCard key={seller.id} seller={seller} products={seller.popularProducts} />;
          })}
        </div>
      )}
    </div>
  );
};

export default ProductListingPage;