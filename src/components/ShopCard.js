import React from 'react';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import './ShopCard.css';

const ShopCard = ({ seller }) => {
  const { id, name, shopName, isVerified, profileImageUrl } = seller;
  const hasImage = profileImageUrl && profileImageUrl.length > 0;

  return (
    <Link to={`/shops/${id}`} className="shop-card-link">
      <div className="shop-card">
        {hasImage ?
          <SafeImage src={profileImageUrl} alt={`${shopName || name} storefront`} className="shop-image" fallbackIcon="fa-store" /> :
          <div className="shop-avatar">
            <span>{(shopName || name).charAt(0)}</span>
          </div>
        }
        <div className="shop-info">
          <h3 className="shop-name">{shopName || name}</h3>
          {isVerified && <span className="shop-verified-badge"><i className="fas fa-check-circle"></i> Verified</span>}
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;