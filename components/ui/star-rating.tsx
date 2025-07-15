import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isHalfFilled = starValue === Math.ceil(rating) && rating % 1 !== 0;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            disabled={!interactive}
            className={cn(
              'transition-colors duration-200',
              interactive && 'hover:scale-110 cursor-pointer',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? 'text-yellow-400 fill-current'
                  : isHalfFilled
                  ? 'text-yellow-400 fill-current opacity-50'
                  : 'text-gray-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}; 