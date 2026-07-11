import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from './SafeImage';
import './ShopCard.css';

const ShopCard = ({ seller, products = [] }) => {
  const { id, name, shopName, isVerified, bannerImageUrl, phone } = seller;
  const navigate = useNavigate();

  // Render backend aggregated popular items natively
  const previewProducts = products && products.length > 0 ? products.slice(0, 3) : [];

  const handleProductClick = (e, productId) => {
    e.preventDefault();
    e.stopPropagation(); // Stop triggering the parent link to the shop storefront
    navigate(`/products/${productId}`);
  };

  return (
    <Link to={`/shops/${id}`} className="shop-card-link">
      <style>{`
        .shop-card {
          background: #fff !important;
          border: 1px solid #e9ecef !important;
          border-radius: 8px !important;
          padding: 1rem !important;
          transition: transform 0.2s, box-shadow 0.2s !important;
          display: flex !important;
          flex-direction: column !important;
          grid-template-columns: none !important;
          align-items: stretch !important;
          gap: 1rem !important;
          height: 100% !important;
          box-sizing: border-box !important;
        }
        .shop-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .shop-main-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .shop-banner-wrapper {
          height: 120px; /* Increased height for better visibility */
          overflow: hidden;
          border-radius: 7px;
          margin: 0 -1rem; /* Pull banner edge-to-edge horizontally */
          border-radius: 0; /* Remove inner border radius so it spans flat against card borders */
        }
        .shop-banner-wrapper .shop-card-banner,
        .shop-banner-wrapper .shop-card-banner img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        .shop-card-banner {
          width: 100%;
          height: 100%;
          object-fit: cover; /* Ensures banner image covers the area */
        }
        .shop-banner-wrapper .shop-card-banner {
          width: 100%;
          height: 100%;
        }
        .shop-products-count {
          font-size: 0.85rem;
          color: #6c757d;
          display: block;
          margin-top: 2px;
          font-weight: 500;
        }
        .shop-products-preview {
          border-top: 1px dashed #e9ecef;
          padding-top: 1rem;
        }
        .preview-title {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #868e96;
          margin: 0 0 0.75rem 0;
          font-weight: 700;
        }
        .preview-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .preview-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #f1f3f5;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .preview-item:hover {
          transform: scale(1.05);
        }
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover; /* Ensures preview image covers the area */
        }
        .preview-price {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(90, 24, 154, 0.9);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
      <div className="shop-card">
        <div className="shop-main-info">
          <div className="shop-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 className="shop-name" style={{ margin: 0 }}>{shopName || name}</h3>
              {isVerified && (
                <span className="shop-verified-badge" style={{ margin: 0 }}>
                  <i className="fas fa-check-circle"></i> Verified
                </span>
              )}
            </div>
            {products.length > 0 && (
              <span className="shop-products-count">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
            )}
            {phone && (
              <span style={{ fontSize: '0.85rem', color: '#495057', display: 'block', marginTop: '4px' }}>
                <i className="fas fa-phone-alt" style={{ marginRight: '5px', color: '#5A189A' }}></i> {phone}
              </span>
            )}
          </div>
        </div>

        <div className="shop-banner-wrapper">
          {bannerImageUrl ? (
            <SafeImage src={bannerImageUrl} alt={`${shopName || name} banner`} className="shop-card-banner" fallbackIcon="fa-image" />
          ) : (
            <SafeImage src={null} alt="No Banner Available" className="shop-card-banner" fallbackIcon="fa-image" />
          )}
        </div>

        {previewProducts.length > 0 && (
          <div className="shop-products-preview">
            <h4 className="preview-title">Popular Items</h4>
            <div className="preview-gallery">
              {previewProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="preview-item"
                  onClick={(e) => handleProductClick(e, product.id)}
                  title={`View ${product.name}`}
                >
                  <SafeImage 
                    src={product.imageUrls[0]} 
                    alt={product.name} 
                    className="preview-image" 
                  />
                  <span className="preview-price">₹{product.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ShopCard;