import React, { useState } from 'react';
import IntroSlide from '../components/IntroSlide';
import './AppIntroScreen.css';

const slides = [
  {
    title: 'Discover Products',
    description: 'Browse items being sold by your neighbors in the society.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999',
  },
  {
    title: 'Sell Your Goods',
    description: 'Easily list items you no longer need and sell them to fellow residents.',
    imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=2070',
  },
  {
    title: 'Connect with Neighbors',
    description: 'A trusted community marketplace right at your doorstep.',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070',
  },
];

const AppIntroScreen = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onNavigate(); // Signal that the intro is finished
    }
  };

  const handleSkip = () => {
    onNavigate(); // Signal that the intro is finished
  };

  return (
    <div className="app-intro-screen">
      <button className="skip-button" onClick={handleSkip}>Skip</button>
      <div className="slides-container">
        <IntroSlide
          title={slides[currentSlide].title}
          description={slides[currentSlide].description}
          imageUrl={slides[currentSlide].imageUrl}
        />
      </div>
      <div className="intro-navigation">
        <button className="btn btn-primary" onClick={handleNext}>
          {currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};

export default AppIntroScreen;