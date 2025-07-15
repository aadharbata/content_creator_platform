import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import axios from 'axios';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  onReviewSubmitted: () => void;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      fetchExistingReview();
    }
  }, [isOpen, productId]);

  const fetchExistingReview = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/products/${productId}/review`, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.review) {
        setExistingReview(response.data.review);
        setRating(response.data.review.rating);
        setComment(response.data.review.comment || '');
      } else {
        setExistingReview(null);
        setRating(0);
        setComment('');
      }
    } catch (error) {
      console.error('Error fetching existing review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        `/api/products/${productId}/review`,
        {
          rating,
          comment: comment.trim() || undefined
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        onReviewSubmitted();
        onClose();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setError(
        error.response?.data?.error || 
        'Failed to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  // Show loading state while fetching review
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-100">
              Loading Review...
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
            <div className="text-center text-gray-400 text-sm">
              Loading your review...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there's an existing review, show read-only view
  if (existingReview) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-bold text-gray-100">
              Your Review
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                {productTitle}
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Your Rating
              </label>
              <div className="flex items-center space-x-2">
                <StarRating
                  rating={existingReview.rating}
                  interactive={false}
                  size="lg"
                />
                <span className="text-sm text-gray-400">
                  {existingReview.rating}/5
                </span>
              </div>
            </div>

            {existingReview.comment && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Your Comment
                </label>
                <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100">
                  {existingReview.comment}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 text-center pt-2">
              Review submitted on {new Date(existingReview.createdAt).toLocaleDateString()}
            </div>

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleClose}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the edit form for new reviews
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-gray-100">
            Write a Review
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              {productTitle}
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Rating *
            </label>
            <div className="flex items-center space-x-2">
              <StarRating
                rating={rating}
                interactive={true}
                onRatingChange={setRating}
                size="lg"
              />
              <span className="text-sm text-gray-400">
                {rating > 0 ? `${rating}/5` : 'Select rating'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-yellow-500 resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-400 text-right">
              {comment.length}/500
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 