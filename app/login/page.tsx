'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { signIn, useSession, signOut } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, Moon, ArrowLeft, Home } from "lucide-react";

const Login = () => {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const { language, translations } = useLanguage();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You can also store this preference in localStorage
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  // Load dark mode preference on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Handle redirect after successful login
  useEffect(() => {
    console.log("🔍 Login page - Session status:", status);
    console.log("🔍 Login page - Session data:", session);
    
    // Only redirect if user just logged in successfully, not if they manually navigated to login page
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      const userId = (session.user as any).id;
      
      // Check if this is a fresh login (has a success message, came from sign-in, or OAuth success)
      const isFromSignIn = searchParams?.get('from') === 'signin' || success || 
                           searchParams?.get('oauth_success') === 'true' || 
                           searchParams?.get('signin_success') === 'true';
      
      console.log("✅ Session authenticated", { userRole, userId, isFromSignIn });
      
      // Only auto-redirect if this was a successful login, not manual navigation
      if (isFromSignIn) {
        console.log("🔄 Auto-redirecting after successful login...");
        
        // Redirect to appropriate dashboard based on role
        if (userRole === 'CREATOR' && userId) {
          console.log("👨‍💻 Directing to creator dashboard!");
          router.push(`/creator/${userId}/dashboard`);
        } else if (userRole === 'CONSUMER') {
          console.log("👤 Directing to consumer channel!");
          router.push('/consumer-channel');
        } else {
          console.log("❓ Unknown role, directing to home");
          router.push('/');
        }
      } else {
        console.log("🔍 User manually navigated to login page while authenticated - allowing");
      }
    }
  }, [session, status, router, searchParams, success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier: form.identifier,
        password: form.password,
      });

      console.log("Result of login: ", result);

      if (result?.error) {
        // Handle specific error cases
        if (result.error === "CredentialsSignin") {
          setError(language === 'hi' ? "गलत ईमेल/फोन या पासवर्ड।" : "Invalid email/phone or password.");
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        setSuccess(language === 'hi' ? "लॉगिन सफल! पुनर्निर्देशित कर रहे हैं..." : "Login successful! Redirecting...");
        console.log("Login successful, waiting for session to update...");
        // The useEffect will handle the redirect when session updates
      }
    } catch (err) {
      setError(language === 'hi' ? "एक अनपेक्षित त्रुटि हुई।" : "An unexpected error occurred.");
    }

    setLoading(false);
  };

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 text-gray-600'}`}>
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
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

      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-colors shadow-lg ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-600'
          }`}
        >
          <Moon className="w-5 h-5" />
        </button>
      </div>

      {/* Main login card */}
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-8 border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">CP</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome back
          </h1>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Please sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email/Phone Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Email or Phone
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <input
                name="identifier"
                type="text"
                value={form.identifier}
                onChange={handleChange}
                placeholder="you@example.com or 1234567890"
                required
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-gray-600 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-sm text-purple-600 hover:text-purple-800 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className={`absolute inset-0 flex items-center ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <div className={`w-full border-t ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-400' 
                  : 'bg-white text-gray-500'
              }`}>or</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => signIn('google', { redirect: false })}
            className={`w-full flex items-center justify-center gap-3 border rounded-lg py-3 font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <img src="/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </form>

        {/* Error/Success Messages */}
        {error && (
          <div className={`mt-4 p-3 border rounded-lg ${
            isDarkMode 
              ? 'bg-red-900/50 border-red-700' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className={`mt-4 p-3 border rounded-lg ${
            isDarkMode 
              ? 'bg-green-900/50 border-green-700' 
              : 'bg-green-50 border-green-200'
          }`}>
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-purple-600 font-semibold hover:text-purple-800 hover:underline transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>

        {/* Phone login instructions */}
        <div className="mt-4 text-xs text-center">
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            Phone login: Enter 10 digits only (e.g., 1234567890).
          </p>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            You can sign in with either email or phone number.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 