'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SubscriptionManagerProps {
  creatorId: string;
}

export const SubscriptionManager = ({ creatorId }: SubscriptionManagerProps) => {
  const [subscriptionType, setSubscriptionType] = useState<'paid' | 'free' | 'trial'>('free'); // Changed from 'paid' to 'free'
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(0);
  const [trialDuration, setTrialDuration] = useState<1 | 7 | 14 | 30>(1); // Added 7 as valid option
  const [isTrialDurationLocked, setIsTrialDurationLocked] = useState<boolean>(false); // New state to track if trial duration is locked
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Fetch current subscription settings
  useEffect(() => {
    const fetchSubscriptionSettings = async () => {
      try {
        const response = await fetch(`/api/creator/${creatorId}/subscription-settings`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptionType(data.subscriptionType || 'paid');
          setSubscriptionPrice(data.subscriptionPrice || 0);
          setTrialDuration(data.trialDuration || 7);
          
          // Lock trial duration if it was previously set and saved
          if (data.subscriptionType === 'trial' && data.trialDuration) {
            setIsTrialDurationLocked(true);
            console.log('🔒 Trial duration is locked at', data.trialDuration, 'days');
          }
          
          console.log('📄 Creator subscription settings:', data);
        } else {
          console.log('❌ Failed to fetch subscription settings:', response.status);
          // Set default settings if fetch fails
          setSubscriptionType('free'); // Changed from 'paid' to 'free'
          setSubscriptionPrice(0);
          setTrialDuration(1); // Changed from 7 to 1
          setIsTrialDurationLocked(false);
        }
      } catch (error) {
        console.error('❌ Error fetching subscription settings:', error);
        setSubscriptionType('free'); // Changed from 'paid' to 'free'
        setSubscriptionPrice(0);
        setTrialDuration(1); // Changed from 7 to 1
        setIsTrialDurationLocked(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionSettings();
  }, [creatorId]);

  // Save subscription settings
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/creator/${creatorId}/subscription-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionType,
          subscriptionPrice: subscriptionType === 'paid' || subscriptionType === 'trial' ? subscriptionPrice : null,
          trialDuration: subscriptionType === 'trial' ? trialDuration : null,
        }),
      });

      if (response.ok) {
        console.log('✅ Subscription settings saved successfully');
        
        // Lock trial duration after successful save if trial type is selected
        if (subscriptionType === 'trial') {
          setIsTrialDurationLocked(true);
          console.log('🔒 Trial duration locked after save');
        }
        
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save subscription settings:', errorData);
        alert('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving subscription settings:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading subscription settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Subscription Model</h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose how you want to manage access to your content. You can change this setting anytime.
        </p>
      </div>

      {/* Current Subscription Status */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📊</span>
            Your Current Subscription Status
          </h4>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            subscriptionType === 'paid' ? 'bg-blue-100 text-blue-700' :
            subscriptionType === 'trial' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {subscriptionType === 'paid' ? '💰 Paid' : 
             subscriptionType === 'trial' ? '🎁 Trial' : 
             '🆓 Free'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subscription Type Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-2">Subscription Type</h5>
            <div className="space-y-2">
              {subscriptionType === 'paid' && (
                <>
                  <p className="text-sm text-gray-600">💰 <strong>Paid Subscription</strong></p>
                  <p className="text-sm text-gray-600">Monthly Price: <strong className="text-green-600">₹{subscriptionPrice}</strong></p>
                  <p className="text-xs text-gray-500">Users need to subscribe to access your content</p>
                </>
              )}
              {subscriptionType === 'trial' && (
                <>
                  <p className="text-sm text-gray-600">🎁 <strong>Free Trial + Paid</strong></p>
                  <p className="text-sm text-gray-600">
                    Trial Duration: <strong className="text-blue-600">
                      {trialDuration === 1 ? '1 minute (Test Mode)' : `${trialDuration} days`}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-600">Price After Trial: <strong className="text-green-600">₹{subscriptionPrice}/month</strong></p>
                  <p className="text-xs text-gray-500">New users get free access, then pay monthly</p>
                </>
              )}
              {subscriptionType === 'free' && (
                <>
                  <p className="text-sm text-gray-600">🆓 <strong>Free Access</strong></p>
                  <p className="text-sm text-gray-600">Price: <strong className="text-green-600">₹0 (Free)</strong></p>
                  <p className="text-xs text-gray-500">All content is freely accessible to users</p>
                </>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-2">Access Summary</h5>
            <div className="space-y-2">
              {subscriptionType === 'paid' && (
                <>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">Content is behind paywall</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">Subscribers get full access</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    💡 Users must pay ₹{subscriptionPrice}/month to access
                  </p>
                </>
              )}
              {subscriptionType === 'trial' && (
                <>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">Free trial for {trialDuration === 1 ? '1 min' : `${trialDuration} days`}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">Then ₹{subscriptionPrice}/month</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    🎁 New users get {trialDuration === 1 ? '1-minute test trial' : `${trialDuration}-day free trial`}
                  </p>
                </>
              )}
              {subscriptionType === 'free' && (
                <>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">All content is free</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">No subscription needed</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    🆓 Anyone can access your content
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Options */}
      <div className="space-y-4">
        {/* Paid Option */}
        <div 
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            subscriptionType === 'paid' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
          onClick={() => setSubscriptionType('paid')}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              subscriptionType === 'paid' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {subscriptionType === 'paid' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">💰 Paid Subscription</h4>
              <p className="text-sm text-gray-600 mt-1">
                Users need to subscribe to access your premium content. You can set your own pricing.
              </p>
              {subscriptionType === 'paid' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Subscription Price (₹)
                  </label>
                  <Input
                    type="number"
                    value={subscriptionPrice === 0 ? '' : subscriptionPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === '0') {
                        setSubscriptionPrice(0);
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setSubscriptionPrice(numValue);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // Clear the input if it's 0 when focused
                      if (subscriptionPrice === 0) {
                        e.target.select();
                      }
                    }}
                    placeholder="Enter price (e.g., 299)"
                    min="1"
                    max="10000"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set a competitive price for your monthly subscription
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Free Trial Option */}
        <div 
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            subscriptionType === 'trial' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-green-300'
          }`}
          onClick={() => setSubscriptionType('trial')}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              subscriptionType === 'trial' ? 'border-green-500 bg-green-500' : 'border-gray-300'
            }`}>
              {subscriptionType === 'trial' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">🎁 Free Trial for First Users</h4>
              <p className="text-sm text-gray-600 mt-1">
                New users get free access for a limited time, then automatically switch to paid subscription.
              </p>
              {subscriptionType === 'trial' && (
                <div className="mt-4 space-y-4">
                  {/* Trial Duration Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Trial Duration
                      {isTrialDurationLocked && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          🔒 Locked
                        </span>
                      )}
                    </label>
                    <div className="flex space-x-3">
                      {[
                        { value: 1, label: '1 minute', testMode: true },
                        { value: 7, label: '7 days', testMode: false },
                        { value: 14, label: '14 days', testMode: false },
                        { value: 30, label: '30 days', testMode: false }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => !isTrialDurationLocked && setTrialDuration(option.value as 1 | 7 | 14 | 30)}
                          disabled={isTrialDurationLocked}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            trialDuration === option.value
                              ? isTrialDurationLocked 
                                ? 'border-orange-400 bg-orange-100 text-orange-800'
                                : 'border-green-500 bg-green-500 text-white'
                              : isTrialDurationLocked
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 text-gray-700 hover:border-green-300'
                          } ${option.testMode && !isTrialDurationLocked ? 'ring-2 ring-yellow-300' : ''}`}
                        >
                          {option.label}
                          {option.testMode && <span className="ml-1 text-xs">(Test)</span>}
                          {trialDuration === option.value && isTrialDurationLocked && (
                            <span className="ml-1 text-xs">🔒</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Users get free access for {trialDuration === 1 ? '1 minute' : `${trialDuration} days`}, then need to pay to continue
                      {trialDuration === 1 && <span className="text-yellow-600 font-medium"> (Testing mode)</span>}
                      {isTrialDurationLocked && (
                        <span className="text-orange-600 font-medium"> • Duration is locked and cannot be changed</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Price after trial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price After Trial Ends (₹/month)
                    </label>
                    <Input
                      type="number"
                      value={subscriptionPrice === 0 ? '' : subscriptionPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === '0') {
                          setSubscriptionPrice(0);
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setSubscriptionPrice(numValue);
                          }
                        }
                      }}
                      onFocus={(e) => {
                        if (subscriptionPrice === 0) {
                          e.target.select();
                        }
                      }}
                      placeholder="Enter price (e.g., 299)"
                      min="1"
                      max="10000"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      After {trialDuration} days, users will be charged this amount monthly
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Free Access Option */}
        <div 
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            subscriptionType === 'free' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
          onClick={() => setSubscriptionType('free')}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              subscriptionType === 'free' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
            }`}>
              {subscriptionType === 'free' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">🆓 Free Access</h4>
              <p className="text-sm text-gray-600 mt-1">
                All your content will be freely accessible to users. No subscription required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Changes will apply immediately to new visitors</strong>
              <br />
              Existing subscribers will not be affected by these changes.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveChanges}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          Changes saved successfully!
        </div>
      )}
    </div>
  );
}; 