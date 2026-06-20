import React, { useState, useEffect, useRef } from 'react';

const SafeImage = ({ src, alt, className, style, fallbackIcon = 'fa-image', ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }
    setHasError(false);
    if (imageRef.current && imageRef.current.complete) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [src]);

  if (hasError) {
    return (
      <div 
        className={className}
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#e9ecef', 
          color: '#adb5bd',
          ...style
        }}
        {...props}
      >
        <i className={`fas ${fallbackIcon}`} style={{ fontSize: '2rem' }}></i>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }} {...props}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          zIndex: 1
        }}>
          <div className="safe-image-spinner" style={{
            width: '24px',
            height: '24px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #5A189A',
            borderRadius: '50%',
            animation: 'safe-spin 1s linear infinite'
          }}></div>
        </div>
      )}
      <style>{`
        @keyframes safe-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        style={{
          opacity: isLoading ? 0.2 : 1,
          transition: 'opacity 0.2s ease-in-out',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  );
};

export default SafeImage;