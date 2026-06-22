import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from './SafeImage';
import './ShopCard.css';

const ShopCard = ({ seller, products = [] }) => {
  const { id, name, shopName, isVerified, profileImageUrl, bannerImageUrl } = seller;
  const navigate = useNavigate();
  const hasImage = profileImageUrl && profileImageUrl.length > 0;

  // Show up to the first 3 products as a gallery preview
  const previewProducts = products.slice(0, 3);

  const handleProductClick = (e, productId) => {
    e.preventDefault();
    e.stopPropagation(); // Stop triggering the parent link to the shop storefront
    navigate(`/products/${productId}`);
  };

  return (
    <Link to={`/shops/${id}`} className="shop-card-link">
      <style>{`
        .shop-card {
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
          box-sizing: border-box;
        }
        .shop-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .shop-main-info {
          display: flex;
          align-items: center;
          gap: 1rem;
      position: relative;
    }
    .shop-banner-wrapper {
      margin: -1.5rem -1.5rem 0.5rem -1.5rem;
      height: 100px;
      overflow: hidden;
      border-top-left-radius: 7px;
      border-top-right-radius: 7px;
    }
    .shop-card-banner {
      width: 100%;
      height: 100%;
    }
    .shop-card .shop-image,
    .shop-card .shop-avatar {
      margin-top: -2.5rem;
      border: 3px solid #fff !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.15);
      background: #fff;
      z-index: 2;
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
    <div className="shop-banner-wrapper">
      <SafeImage src={bannerImageUrl || '/default-banner.jpg'} alt={`${shopName || name} banner`} className="shop-card-banner" fallbackIcon="fa-image" />
    </div>
        <div className="shop-main-info">
          {hasImage ? (
            <SafeImage src={profileImageUrl} alt={`${shopName || name} storefront`} className="shop-image" fallbackIcon="fa-store" />
          ) : (
            <div className="shop-avatar">
              <span>{(shopName || name).charAt(0)}</span>
            </div>
          )}
          <div className="shop-info">
            <h3 className="shop-name">{shopName || name}</h3>
            {isVerified && <span className="shop-verified-badge"><i className="fas fa-check-circle"></i> Verified</span>}
            {products.length > 0 && (
              <span className="shop-products-count">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
            )}
          </div>
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
                  <span className="preview-price">${product.price.toFixed(2)}</span>
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