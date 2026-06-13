import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css';
import Review from '../components/Review';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedReportOption, setSelectedReportOption] = useState('');
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // Step 1: Fetch the product
        const productResponse = await fetch(`${process.env.REACT_APP_API_URL}/products/${productId}`);
        if (!productResponse.ok) {
          throw new Error(`Product not found (status: ${productResponse.status})`);
        }
        const productData = await productResponse.json();

        // Step 2: Fetch the seller information using the userId from the product
        const userResponse = await fetch(`${process.env.REACT_APP_API_URL}/users/${productData.userId}`);
        if (userResponse.ok) {
          productData.user = await userResponse.json();
        }

        // Step 3: Fetch the reviews for the product
        const reviewsResponse = await fetch(`${process.env.REACT_APP_API_URL}/reviews?productId=${productId}`);
        if (!reviewsResponse.ok) {
          throw new Error(`Could not fetch reviews (status: ${reviewsResponse.status})`);
        }
        let reviewsData = await reviewsResponse.json();

        // Step 4: Fetch users for the reviews
        const reviewUserIds = [...new Set(reviewsData.map(r => r.userId).filter(Boolean))];
        if (reviewUserIds.length > 0) {
          const reviewUsersResponse = await fetch(`${process.env.REACT_APP_API_URL}/users?ids=${reviewUserIds.join(',')}`);
          if (reviewUsersResponse.ok) {
            const reviewUsersData = await reviewUsersResponse.json();
            const reviewUsersMap = new Map(reviewUsersData.map(u => [u.id, u]));
            reviewsData = reviewsData.map(review => ({ ...review, user: reviewUsersMap.get(review.userId) }));
          }
        }

        setProduct(productData);
        setReviews(reviewsData);
        if (productData.imageUrls && productData.imageUrls.length > 0) {
          setSelectedImage(productData.imageUrls[0]);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  if (loading) return <div className="page-status">Loading...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;
  if (!product) return <div className="page-status">Product not found.</div>;

  const handleAddToCart = () => {
    if (currentUser) {
      addToCart(product);
    } else {
      alert('Please log in to add items to your cart.');
      navigate('/welcome', { state: { addProductAfterLogin: product.id } });
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const finalReason = selectedReportOption === 'Other' ? reportReason.trim() : selectedReportOption;

    if (!finalReason) {
      alert('Please provide a reason for your report.');
      return;
    }

    const report = {
      reportedUserId: product.user.id,
      reportedByUserId: currentUser.id,
      productId: product.id,
      type: 'user',
      reason: finalReason,
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      if (response.ok) {
        alert('Thank you for your report. An admin will review it shortly.');
        setIsReportModalOpen(false);
        setReportReason('');
        setSelectedReportOption('');
      } else {
        throw new Error('Failed to submit report.');
      }
    } catch (error) {
      alert('An error occurred while submitting your report.');
    }
  };

  const reportOptions = [
    'Misleading Information',
    'Prohibited Item',
    'Suspicious Seller',
    'Other'
  ];

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (newReview.rating === 0 || !newReview.comment.trim()) {
      alert('Please provide a rating and a comment.');
      return;
    }
    setIsSubmittingReview(true);

    const reviewPayload = {
      ...newReview,
      userId: currentUser.id,
      productId: productId,
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload),
      });

      if (response.ok) {
        const addedReview = await response.json();
        // Manually add the current user object to the new review to display it immediately
        addedReview.user = currentUser;
        setReviews(prevReviews => [addedReview, ...prevReviews]);
        setNewReview({ rating: 0, comment: '' }); // Reset form
      } else {
        throw new Error('Failed to submit review.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const StarRatingInput = ({ rating, setRating }) => (
    <div className="star-rating-input">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return <span key={ratingValue} className={ratingValue <= rating ? 'star-filled' : 'star-empty'} onClick={() => setRating(ratingValue)}>&#9733;</span>;
      })}
    </div>
  );

  return (
    <div className="product-details-container">
      <Link to="/products" className="back-link">&larr; Back to all products</Link>
      <div className="details-content">
        <div className="details-image-container">
          <img src={selectedImage} alt={product.name} className="details-image-main" />
          <div className="details-thumbnails">
            {product.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${product.name} thumbnail ${index + 1}`}
                className={`thumbnail-image ${url === selectedImage ? 'active' : ''}`}
                onClick={() => setSelectedImage(url)}
              />
            ))}
          </div>
        </div>
        <div className="details-info-container">
          <h1 className="details-name">{product.name}</h1>
          <p className="details-price">${product.price.toFixed(2)}</p>
          <p className="details-category">Category: <span>{product.category}</span></p>
          <div className="details-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
          <div className="details-seller">
            <h3>Seller Information</h3>
            <p className="seller-info-name">
              <strong>Sold by:</strong> {product.user?.shopName || product.user?.name || 'N/A'}
              {product.user?.isVerified && (
                <i className="fas fa-check-circle verified-badge" title="Verified Resident"></i>
              )}
            </p>
            <p className="seller-info-phone">
              <strong>Contact:</strong> <a href={`tel:${product.user?.phone}`}>{product.user?.phone || 'N/A'}</a>
            </p>
            {currentUser && product.user && currentUser.id !== product.user.id && (
              <button className="report-btn" onClick={() => setIsReportModalOpen(true)} title="Report this seller">
                <i className="fas fa-flag"></i> Report Seller
              </button>
            )}
          </div>
          <button className="btn btn-primary contact-seller-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>

      {currentUser && (
        <div className="add-review-section">
          <h3>Write a Review</h3>
          <form onSubmit={handleReviewSubmit}>
            <div className="form-group">
              <label>Your Rating</label>
              <StarRatingInput rating={newReview.rating} setRating={(rating) => setNewReview({ ...newReview, rating })} />
            </div>
            <div className="form-group">
              <label htmlFor="review-comment">Your Comment</label>
              <textarea
                id="review-comment"
                rows="5"
                style={{ width: '100%', minHeight: '120px', padding: '12px' }}
                placeholder="Share your experience with this product..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmittingReview}>
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      <div className="details-reviews-section">
        <h2>Customer Reviews</h2>
        {reviews.length > 0 ? (
          reviews.map(review => (
            <Review key={review.id} review={review} />
          ))
        ) : (
          <p>No reviews for this product yet.</p>
        )}
      </div>
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)}>
        <div className="report-modal-content">
          <h2>Report Seller</h2>
          <p>Why are you reporting <strong>{product.user?.shopName || product.user?.name}</strong>?</p>
          <form onSubmit={handleReportSubmit}>
            <div className="report-options">
              {reportOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`report-option-btn ${selectedReportOption === option ? 'selected' : ''}`}
                  onClick={() => setSelectedReportOption(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {selectedReportOption === 'Other' && (
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Please provide more details..." required />
            )}
            <button type="submit" className="btn btn-primary">Submit Report</button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetailsPage;