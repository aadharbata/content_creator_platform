'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<'CREATOR' | 'CONSUMER' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  useEffect(() => {
    // If user is already authenticated and has a role, but not newly created, redirect them
    if (session?.user && (session.user as any).role) {
      const userRole = (session.user as any).role;
      const userId = (session.user as any).id;
      const createdAt = (session.user as any).createdAt;
      
      // Check if user was created recently (within last 5 minutes)
      const isNewUser = createdAt && (Date.now() - new Date(createdAt).getTime()) < 5 * 60 * 1000;
      
      // If not a new user, redirect to appropriate dashboard
      if (!isNewUser) {
        if (userRole === 'CREATOR' && userId) {
          router.push(`/creator/${userId}/dashboard`);
        } else if (userRole === 'CONSUMER') {
          router.push('/consumer-channel');
        }
      }
    }
  }, [session, router]);

  const handleRoleSelection = async (role: 'CREATOR' | 'CONSUMER') => {
    if (!session?.user) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: (session.user as any).id,
          role: role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Role updated successfully:', data);
        
        // Force session refresh to clear isNewUser flag
        window.location.href = role === 'CREATOR' 
          ? `/creator/${data.user.id}/dashboard` 
          : '/consumer-channel';
      } else {
        setError(data.message || 'Failed to update role');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Role selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to continue</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-tr from-blue-500 via-orange-400 to-purple-500 rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-4 border-white mb-6 mx-auto">
            <span className="text-white text-3xl font-extrabold tracking-widest">CP</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {language === 'hi' ? 'आपकी भूमिका चुनें' : 'Choose Your Role'}
          </h1>
          <p className="text-gray-600 text-lg">
            {language === 'hi' 
              ? 'आप क्या करना चाहते हैं? कंटेंट बनाना या देखना?' 
              : 'What would you like to do? Create content or explore content?'
            }
          </p>
          <div className="mt-2 text-sm text-gray-500">
            {language === 'hi' ? 'स्वागत है' : 'Welcome'}, {session.user.name}!
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Creator Card */}
          <div
            className={`bg-white rounded-2xl p-8 shadow-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'CREATOR' 
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => setSelectedRole('CREATOR')}
          >
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {language === 'hi' ? 'क्रिएटर' : 'Creator'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi' 
                  ? 'कंटेंट बनाएं, कोर्स बेचें, और अपनी ऑडियंस बनाएं' 
                  : 'Create content, sell courses, and build your audience'
                }
              </p>
              <div className="text-sm text-gray-500">
                {language === 'hi' ? 'आपको मिलेगा:' : 'You get:'}
              </div>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• {language === 'hi' ? 'डैशबोर्ड' : 'Creator Dashboard'}</li>
                <li>• {language === 'hi' ? 'कंटेंट अपलोड' : 'Content Upload'}</li>
                <li>• {language === 'hi' ? 'फैन इंटरैक्शन' : 'Fan Interaction'}</li>
                <li>• {language === 'hi' ? 'आय ट्रैकिंग' : 'Revenue Tracking'}</li>
              </ul>
            </div>
          </div>

          {/* Consumer Card */}
          <div
            className={`bg-white rounded-2xl p-8 shadow-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'CONSUMER' 
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedRole('CONSUMER')}
          >
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {language === 'hi' ? 'कंज्यूमर' : 'Consumer'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi' 
                  ? 'कंटेंट देखें, कोर्स खरीदें, और क्रिएटर्स को फॉलो करें' 
                  : 'Explore content, purchase courses, and follow creators'
                }
              </p>
              <div className="text-sm text-gray-500">
                {language === 'hi' ? 'आपको मिलेगा:' : 'You get:'}
              </div>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• {language === 'hi' ? 'कंटेंट फीड' : 'Content Feed'}</li>
                <li>• {language === 'hi' ? 'कोर्स एक्सेस' : 'Course Access'}</li>
                <li>• {language === 'hi' ? 'क्रिएटर चैट' : 'Creator Chat'}</li>
                <li>• {language === 'hi' ? 'पर्सनलाइज़ेशन' : 'Personalization'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={() => selectedRole && handleRoleSelection(selectedRole)}
            disabled={!selectedRole || loading}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
              selectedRole && !loading
                ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:scale-105 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>
                  {language === 'hi' ? 'सेटअप हो रहा है...' : 'Setting up...'}
                </span>
              </div>
            ) : (
              language === 'hi' ? 'जारी रखें' : 'Continue'
            )}
          </button>
        </div>

        {/* Role Change Note */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {language === 'hi' 
            ? 'आप बाद में अपनी भूमिका बदल सकते हैं' 
            : 'You can change your role later in settings'
          }
        </div>
      </div>
    </div>
  );
};

export default RoleSelection; 