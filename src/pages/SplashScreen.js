import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  const [shouldShow, setShouldShow] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');

    // Global event listener to calculate actual page loading progress
    const handleProgressUpdate = (e) => {
      if (e.detail && typeof e.detail.progress === 'number') {
        setProgress(e.detail.progress);
        if (e.detail.progress >= 100) {
          // Trigger seamless fade-out once loaded
          setIsFadingOut(true);
          setTimeout(() => setShouldShow(false), 400);
        }
      }
    };
    window.addEventListener('app-loading-progress', handleProgressUpdate);

    if (hasSeenSplash) {
      setIsFirstVisit(false);
    } else {
      sessionStorage.setItem('hasSeenSplash', 'true');
      setIsFirstVisit(true);
      
      // Simulate progressive steps for initial brand loading sequence
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setIsFadingOut(true);
          setTimeout(() => setShouldShow(false), 400);
        }
        setProgress(currentProgress);
      }, 100);
      return () => {
        clearInterval(interval);
        window.removeEventListener('app-loading-progress', handleProgressUpdate);
      };
    }

    return () => {
      window.removeEventListener('app-loading-progress', handleProgressUpdate);
    };
  }, []);

  if (!shouldShow) return null;

  // Minimalist loader for subsequent refreshes to hold the page while loading
  if (!isFirstVisit) {
    return (
      <div className={`splash-container ${isFadingOut ? 'fade-out' : ''}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', transition: 'opacity 0.4s ease-out' }}>
        <style>{`
          .progress-bar-container {
            width: 200px;
            height: 6px;
            background-color: #f1f3f5;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 1rem;
            border: 1px solid #e9ecef;
          }
          .progress-bar-fill {
            height: 100%;
            background-color: #5A189A;
            transition: width 0.3s ease-out;
          }
          .fade-out {
            opacity: 0 !important;
            pointer-events: none;
          }
        `}</style>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: '500', fontFamily: "'Poppins', sans-serif" }}>
          Loading hungrynow... {progress}%
        </span>
      </div>
    );
  }

  return (
    <div className={`splash-container ${isFadingOut ? 'fade-out' : ''}`} style={{ transition: 'opacity 0.4s ease-out' }}>
      <style>{`
        .initial-progress-bar {
          width: 250px;
          height: 4px;
          background-color: rgba(90, 24, 154, 0.15);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 2rem;
        }
        .initial-progress-fill {
          height: 100%;
          background-color: #5A189A;
          transition: width 0.1s linear;
        }
        .fade-out {
          opacity: 0 !important;
          pointer-events: none;
        }
      `}</style>
      <div className="splash-content">
        <h1 className="splash-logo">hungrynow</h1>
        <div className="initial-progress-bar">
          <div className="initial-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;