import React from 'react';
import './Review.css';

const StarRating = ({ rating }) => {
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={index < rating ? 'star-filled' : 'star-empty'}>&#9733;</span>
      ))}
    </div>
  );
};

const Review = ({ review }) => {
  return (
    <div className="review-card">
      <div className="review-header">
        <span className="review-user-name">{review.user?.name || 'Anonymous'}</span>
        <StarRating rating={review.rating} />
      </div>
      <p className="review-comment">{review.comment}</p>
      <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
    </div>
  );
};

export default Review;