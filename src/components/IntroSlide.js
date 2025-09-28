import React from 'react';
import './IntroSlide.css';

const IntroSlide = ({ title, description, imageUrl }) => {
  return (
    <div className="intro-slide">
      <img src={imageUrl} alt={title} className="slide-image" />
      <h3 className="slide-title">{title}</h3>
      <p className="slide-description">{description}</p>
    </div>
  );
};

export default IntroSlide;