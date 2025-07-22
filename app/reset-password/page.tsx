'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessage('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage('Invalid reset token. Please request a new password reset.');
      return;
    }

    if (!password) {
      setMessage('Please enter your new password');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-400 flex items-center justify-center px-2 py-8">
      <div className="w-full max-w-md mx-auto glass p-8 md:p-12">
        <div className="bg-gradient-to-tr from-blue-500 via-orange-400 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-4 border-white mb-4 mx-auto">
          <span className="text-white text-2xl font-extrabold tracking-widest">
            CP
          </span>
        </div>
        
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-black text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-white/90">
            Enter your new password below
          </p>
        </div>

        {success ? (
          <div className="bg-green-900/30 border border-green-400 rounded-xl p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-300">
                  Password Reset Successful!
                </h3>
                <div className="mt-2 text-sm text-green-200">
                  <p>{message}</p>
                  <p className="mt-2">✅ Redirecting to login page in 3 seconds...</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white text-gray-800 shadow-sm transition-all duration-200 hover:shadow-md"
                    placeholder="Enter your new password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white text-gray-800 shadow-sm transition-all duration-200 hover:shadow-md"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
            </div>

            {message && !success && (
              <div className="bg-red-900/30 border border-red-400 rounded-xl p-4 text-center">
                <p className="text-red-300 text-sm">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !token}
                className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white shadow-lg transition-all duration-200 ${
                  loading || !token
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 hover:scale-105 hover:shadow-xl transform'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
            
            <div className="text-center">
              <Link 
                href="/login"
                className="text-sm text-yellow-300 hover:text-yellow-100 hover:underline transition-colors duration-200 font-semibold"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
      
      <style jsx global>{`
        .glass {
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border-radius: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ResetPassword; 