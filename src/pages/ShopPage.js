import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import './ShopPage.css';

const ShopPage = () => {
  const { sellerId } = useParams();
  const { currentUser } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerImages = seller?.bannerImageUrl ? [seller.bannerImageUrl] : [];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? bannerImages.length - 1 : prev - 1));

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
        const shopFrontObj = Array.isArray(shopFrontData) ? shopFrontData[0] : shopFrontData;
        
        // Safely merge user and shop-front details to prevent null fields in user profile from wiping out valid shopFront metadata
        const sellerData = {
          ...userData,
          ...shopFrontObj,
          shopName: shopFrontObj?.shopName || userData.shopName || userData.name,
          profileImageUrl: userData.profileImageUrl || shopFrontObj?.profileImageUrl
        };
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

  // Auto-slide effect every 5 seconds
  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerImages.length, currentSlide]);

  if (loading) return <div className="page-status">Loading shop...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;
  if (!seller) return <div className="page-status">Shop not found.</div>;

  return (
    <div className="shop-page-container">
      <style>{`
        @media (max-width: 768px) {
          .shop-page-container {
            padding: 0.5rem !important;
            margin: 0 !important;
          }
          .shop-products-title {
            font-size: 1.3rem !important;
            margin-left: 0.25rem !important;
          }
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
          .product-card .add-to-cart-btn,
          .product-card .contact-seller-btn {
            display: none !important;
          }
        }

        /* Banner Card manner container */
        .shop-banner-card {
          background: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
        }

        /* Shop Name Top Header */
        .shop-banner-header {
          padding: 1.5rem;
          background: #fff;
          border-bottom: 1px solid #f1f3f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .shop-banner-title-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .shop-banner-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #212529;
          margin: 0;
        }
        .shop-banner-tagline {
          font-size: 0.95rem;
          color: #6c757d;
          font-style: italic;
          margin: 0;
        }

        /* Main Area Multi-Image Slider */
        .shop-slider-container {
          position: relative;
          width: 100% !important;
          margin: 0 !important;
          height: 350px;
          background-color: #111;
          overflow: hidden;
          border-left: none !important;
          border-right: none !important;
        }
        .shop-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out;
          transform: scale(1.02);
          z-index: 1;
        }
        .shop-slide.active {
          opacity: 1;
          transform: scale(1);
          z-index: 2;
        }
        .shop-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .shop-no-banner-placeholder {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f1f3f5;
          color: #adb5bd;
          height: 100%;
        }
        .slider-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.15), transparent);
          z-index: 3;
          pointer-events: none;
        }
        .slider-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.45);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 4;
          transition: background 0.2s;
        }
        .slider-nav-btn:hover {
          background: rgba(0, 0, 0, 0.65);
        }
        .slider-nav-prev { left: 1rem; }
        .slider-nav-next { right: 1rem; }
        .slider-dots {
          position: absolute;
          bottom: 1.25rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 4;
        }
        .slider-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s;
        }
        .slider-dot.active {
          background: #fff;
          width: 24px;
          border-radius: 4px;
        }

        /* Footer with Contact and Verified Badge */
        .shop-banner-footer {
          padding: 1.25rem 1.5rem;
          background: #f8f9fa;
          border-top: 1px solid #f1f3f5;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .shop-footer-badge-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .verified-badge-pill {
          background-color: #d1e7dd;
          color: #0f5132;
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border: 1px solid #badbcc;
        }
        .shop-contact-links {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .contact-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #fff;
          border: 1px solid #dee2e6;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: #495057;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .contact-pill-btn:hover {
          background: #5A189A;
          color: #fff;
          border-color: #5A189A;
        }
      `}</style>

      {/* Banner Styled as a Card */}
      <div className="shop-banner-card">
        
        {/* 1. Shop Name & Tagline Top Header */}
        <div className="shop-banner-header">
          <div className="shop-banner-title-group">
            <h1 className="shop-banner-title">{seller.shopName || seller.name}</h1>
            {seller.shopTagline && <p className="shop-banner-tagline">"{seller.shopTagline}"</p>}
          </div>
        </div>

        {/* 2. Multi-image Slider (Main Area) */}
        <div className="shop-slider-container">
          {bannerImages.length > 0 ? (
            <>
              <div className="slider-overlay" />
              {bannerImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`shop-slide ${idx === currentSlide ? 'active' : ''}`}
                >
                  <img src={imgUrl} alt={`Banner slide ${idx + 1}`} />
                </div>
              ))}
            </>
          ) : (
            <div className="shop-no-banner-placeholder">
              <i className="fas fa-image" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#495057' }}>No Banner Preview Available</span>
            </div>
          )}

          {/* Slider Navigation controls */}
          {bannerImages.length > 1 && (
            <>
              <button className="slider-nav-btn slider-nav-prev" onClick={prevSlide} aria-label="Previous image">
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="slider-nav-btn slider-nav-next" onClick={nextSlide} aria-label="Next image">
                <i className="fas fa-chevron-right"></i>
              </button>
              <div className="slider-dots">
                {bannerImages.map((_, idx) => (
                  <button
                    key={idx}
                    className={`slider-dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. Seller Contact and Verified Tick Below the Banner */}
        <div className="shop-banner-footer">
          <div className="shop-footer-badge-section">
            <span style={{ fontSize: '0.9rem', color: '#495057', fontWeight: 'bold' }}>
              Merchant Profile
            </span>
            {seller.isVerified && (
              <span className="verified-badge-pill">
                <i className="fas fa-check-circle"></i> Verified Seller
              </span>
            )}
          </div>
          <div className="shop-contact-links">
            {seller.phone && (
              <a href={`tel:${seller.phone}`} className="contact-pill-btn">
                <i className="fas fa-phone"></i> {seller.phone}
              </a>
            )}
            {seller.email && (
              <a href={`mailto:${seller.email}`} className="contact-pill-btn">
                <i className="fas fa-envelope"></i> Email Merchant
              </a>
            )}
          </div>
        </div>

      </div>

      <h2 className="shop-products-title">Products from this Shop</h2>
      <div className="product-grid">
        {products.map(product => {
          // Ensure that if a user is not logged in, we trigger the read-only view block
          const isReadOnly = !currentUser;
          const processedProduct = {
            ...product,
            hideAddToCart: isReadOnly,
            isFallback: isReadOnly
          };
          return (
            <div
              key={product.id}
              className={isReadOnly ? "fallback-readonly-wrapper" : ""}
            >
              <ProductCard product={processedProduct} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopPage;