'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Users, Palette, ArrowRight, Info, Moon, ArrowLeft } from 'lucide-react';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<'CREATOR' | 'CONSUMER' | null>('CONSUMER');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/signup/form?role=${selectedRole}`);
    }
  };

  const roles = [
    {
      id: 'CONSUMER',
      title: language === 'hi' ? 'मैं एक Fan हूं' : 'I am a Fan',
      description: language === 'hi' ? 'अपने पसंदीदा creators के साथ जुड़ें और अद्भुत content खोजें' : 'Connect with your favorite creators and discover amazing content',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      tag: null,
      tagColor: null
    },
    {
      id: 'CREATOR',
      title: language === 'hi' ? 'मैं एक Creator हूं' : 'I am a Creator', 
      description: language === 'hi' ? 'अपनी content शेयर करें और community बनाएं' : 'Share your content and build your community',
      icon: <Palette className="w-6 h-6 text-purple-500" />,
      tag: null,
      tagColor: null
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-2 py-8 font-inter transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
    }`}>
      {/* Go Home button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push('/')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Go Home</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <div className="flex space-x-2 mb-2">
          <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          <div className={`w-8 h-1 rounded-full ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`}></div>
        </div>
        <span className={`text-xs font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Step 1 of 2
        </span>
      </div>

      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition-all duration-200 ${
            isDarkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          } shadow-lg`}
        >
          <Moon className="w-5 h-5" />
        </button>
      </div>

      <main className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      } mt-10 mb-8 flex flex-col items-center text-center`}>
        <div className="bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center shadow-xl mb-6">
          <span className="text-white text-2xl font-extrabold tracking-widest">
            CP
          </span>
        </div>
        
        <h1 className={`text-3xl md:text-4xl font-black mb-2 tracking-tight transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        } font-poppins`}>
          {language === 'hi' ? 'Sign up' : 'Sign up'}
        </h1>
        
        <p className={`text-md mb-8 font-medium transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {language === 'hi' 
            ? 'आप community का हिस्सा कैसे बनना चाहते हैं?'
            : 'How do you want to be part of the community?'
          }
        </p>

        <div className="w-full space-y-4 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id as 'CREATOR' | 'CONSUMER')}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedRole === role.id
                  ? isDarkMode
                    ? 'border-purple-400 bg-purple-900/20 shadow-lg transform scale-105'
                    : 'border-purple-500 bg-purple-50 shadow-lg transform scale-105'
                  : isDarkMode
                    ? 'border-gray-600 bg-gray-700 hover:border-purple-400 hover:bg-gray-600'
                    : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-25'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    {role.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold text-lg transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {role.title}
                      </h3>
                      {role.id === 'CREATOR' && (
                        <Info className={`w-4 h-4 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                    <p className={`text-sm mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {role.description}
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                  selectedRole === role.id
                    ? 'border-purple-500 bg-purple-500'
                    : isDarkMode ? 'border-gray-500' : 'border-gray-300'
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
          className={`w-full py-3 rounded-2xl font-bold shadow-lg transition transform duration-200 flex items-center justify-center space-x-2 ${
            selectedRole
              ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:scale-105'
              : isDarkMode 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>{language === 'hi' ? 'Continue' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className={`mt-6 text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{" "}
          <a
            href="/login"
            className="text-purple-600 font-bold hover:text-purple-800 hover:underline transition-colors duration-200"
          >
            {language === 'hi' ? 'Sign in' : 'Sign in'}
          </a>
        </p>

        <div className={`mt-4 text-xs text-center p-3 rounded-xl transition-colors duration-300 ${
          isDarkMode 
            ? 'text-gray-400 bg-gray-700' 
            : 'text-gray-500 bg-gray-50'
        }`}>
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