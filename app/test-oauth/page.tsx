'use client';

import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestOAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Test OAuth Page - Session Status:', status);
    console.log('🔍 Test OAuth Page - Session Data:', session);
  }, [session, status]);

  const handleGoogleSignIn = async () => {
    console.log('🔐 Starting Google OAuth...');
    try {
      const result = await signIn('google', {
        callbackUrl: '/consumer-channel',
        redirect: true
      });
      console.log('🔐 Google OAuth Result:', result);
    } catch (error) {
      console.error('❌ Google OAuth Error:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🔓 Signing out...');
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">OAuth Test Page</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Session Status</h2>
            <p className="text-gray-600">Status: {status}</p>
            {session && (
              <div className="mt-2 p-3 bg-gray-50 rounded">
                <p><strong>Name:</strong> {session.user?.name}</p>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Role:</strong> {(session.user as any)?.role}</p>
                <p><strong>ID:</strong> {(session.user as any)?.id}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {!session ? (
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Sign in with Google
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/consumer-channel')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  Go to Consumer Channel
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 