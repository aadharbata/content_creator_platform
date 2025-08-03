import React, { useState, useEffect } from 'react';

interface ViewerCountProps {
  count: number;
  isLive?: boolean;
  variant?: 'broadcast' | 'viewer';
  size?: 'small' | 'medium' | 'large';
}

const ViewerCount: React.FC<ViewerCountProps> = ({ 
  count, 
  isLive = false, 
  variant = 'viewer',
  size = 'medium'
}) => {
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count !== prevCount) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setPrevCount(count);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [count, prevCount]);

  const getStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: variant === 'broadcast' ? '20px' : '15px',
      fontWeight: 'bold' as const,
      transition: 'all 0.3s ease',
      transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
    };

    const sizeStyles = {
      small: {
        padding: '4px 8px',
        fontSize: '12px',
      },
      medium: {
        padding: '8px 16px',
        fontSize: '14px',
      },
      large: {
        padding: '12px 20px',
        fontSize: '16px',
      }
    };

    const variantStyles = {
      broadcast: {
        backgroundColor: '#28a745',
        color: 'white',
        boxShadow: isAnimating ? '0 0 20px rgba(40, 167, 69, 0.5)' : 'none',
      },
      viewer: {
        backgroundColor: '#dc3545',
        color: 'white',
        boxShadow: isAnimating ? '0 0 20px rgba(220, 53, 69, 0.5)' : 'none',
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getViewerCountStyles = () => {
    if (variant === 'broadcast' && isLive) {
      return {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: size === 'large' ? '14px' : '12px',
        transition: 'all 0.3s ease',
      };
    }
    return {};
  };

  return (
    <div style={getStyles()}>
      {variant === 'broadcast' && isLive && (
        <>
          🔴 LIVE
          <span style={getViewerCountStyles()}>
            👁️ {count} {count === 1 ? 'viewer' : 'viewers'}
          </span>
        </>
      )}
      {variant === 'viewer' && (
        <>
          👁️ {count} {count === 1 ? 'viewer' : 'viewers'}
        </>
      )}
      {!isLive && variant === 'broadcast' && (
        <>
          📺 Stream Ready
        </>
      )}
    </div>
  );
};

export default ViewerCount;
