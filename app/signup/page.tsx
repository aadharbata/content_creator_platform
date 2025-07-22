'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<'CREATOR' | 'CONSUMER' | null>(null);
  const { language } = useLanguage();
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/signup/form?role=${selectedRole}`);
    }
  };

  const roles = [
    {
      id: 'CONSUMER',
      title: language === 'hi' ? 'मैं एक Fan हूं' : 'I am a Fan',
      description: language === 'hi' ? 'अपने पसंदीदा creators के साथ जुड़ें' : 'Connect with your favorite creators',
      icon: '👤'
    },
    {
      id: 'CREATOR',
      title: language === 'hi' ? 'मैं एक Creator हूं' : 'I am a Creator', 
      description: language === 'hi' ? 'अपनी content शेयर करें और community बनाएं' : 'Share your content and build your community',
      icon: '😊'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-400 flex flex-col justify-center items-center px-2 py-8 font-inter">
      <main className="w-full max-w-md mx-auto glass p-8 md:p-12 mt-10 mb-8 flex flex-col items-center text-center">
        <div className="bg-gradient-to-tr from-blue-500 via-orange-400 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-4 border-white mb-6">
          <span className="text-white text-2xl font-extrabold tracking-widest">
            CP
          </span>
        </div>
        
        <h1 className="hero-title text-3xl md:text-4xl font-black mb-2 tracking-tight text-white font-poppins shadow-sm">
          {language === 'hi' ? 'Sign up' : 'Sign up'}
        </h1>
        
        <p className="text-md text-white/90 mb-8 font-medium">
          {language === 'hi' 
            ? 'आप Passes community का हिस्सा कैसे बनना चाहते हैं?'
            : 'Choose how you want to be part of the Passes community.'
          }
        </p>

        <div className="w-full space-y-4 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id as 'CREATOR' | 'CONSUMER')}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedRole === role.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-105'
                  : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-25'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{role.icon}</div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {role.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {role.description}
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === role.id
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}>
                  {selectedRole === role.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`w-full py-3 rounded-2xl font-bold shadow-lg transition transform duration-200 ${
            selectedRole
              ? 'bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {language === 'hi' ? 'Continue' : 'Continue'}
        </button>

        <p className="mt-6 text-sm text-white">
          {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{" "}
          <a
            href="/login"
            className="text-yellow-300 font-bold hover:text-yellow-100 hover:underline transition-colors duration-200"
          >
            {language === 'hi' ? 'Sign in' : 'Sign in'}
          </a>
        </p>

        <div className="mt-4 text-xs text-white/80 text-center bg-black/20 p-3 rounded-xl backdrop-blur-sm">
          {language === 'hi' 
            ? 'खाता बनाकर आप हमारी Terms of Service और Privacy Policy से सहमत हैं।'
            : 'By creating an account, you agree to our Terms of Service and Privacy Policy.'
          }
        </div>
      </main>
    </div>
  );
};

export default RoleSelection; 