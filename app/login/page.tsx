'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { signIn, useSession, signOut } from "next-auth/react";

const Login = () => {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { language, translations } = useLanguage();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  // Handle redirect after successful login
  useEffect(() => {
    console.log("🔍 Login page - Session status:", status);
    console.log("🔍 Login page - Session data:", session);
    
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      const userId = (session.user as any).id;
      
      console.log("✅ Session authenticated, redirecting...", { userRole, userId });
      
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
    }
  }, [session, status, router]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-400 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-400 flex flex-col justify-center items-center px-2 py-8 font-inter">
      <main className="w-full max-w-md mx-auto glass p-8 md:p-12 mt-10 mb-8 flex flex-col items-center text-center">
        <div className="bg-gradient-to-tr from-blue-500 via-orange-400 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-4 border-white mb-4">
          <span className="text-white text-2xl font-extrabold tracking-widest">
            CP
          </span>
        </div>
        <h1 className="hero-title text-3xl md:text-4xl font-black mb-2 tracking-tight text-white font-poppins shadow-sm">
          {language === 'hi' ? 'लॉगिन' : 'Login'}
        </h1>
        <p className="text-md text-white/90 mb-6 font-medium">
          {language === 'hi' 
            ? 'वापसी पर स्वागत है! कृपया अपने खाते में लॉगिन करें।' 
            : 'Welcome back! Please login to your account.'
          }
        </p>
        
        <form
          className="w-full flex flex-col gap-4 text-left"
          onSubmit={handleSubmit}
        >
          <label className="font-semibold text-white">
            {language === 'hi' ? 'ईमेल या फोन' : 'Email or Phone'}
            <input
              name="identifier"
              type="text"
              value={form.identifier}
              onChange={handleChange}
              placeholder={language === 'hi' ? 'आप@email.com या 9876543210' : 'you@email.com or 9876543210'}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white text-gray-800 shadow-sm transition-all duration-200 hover:shadow-md"
            />
            <div className="text-xs text-gray-200 mt-1 bg-black/20 p-2 rounded-lg backdrop-blur-sm">
              {language === 'hi' 
                ? 'फोन नंबर के लिए: केवल 10 अंक (जैसे 9876543210)'
                : 'For phone: 10 digits only (e.g., 9876543210)'
              }
            </div>
          </label>
          
          <label className="font-semibold text-white">
            {language === 'hi' ? 'पासवर्ड' : 'Password'}
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={language === 'hi' ? 'पासवर्ड' : 'Password'}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white text-gray-800 shadow-sm transition-all duration-200 hover:shadow-md"
            />
          </label>
          
          {/* Forgot Password Link */}
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-sm text-yellow-300 hover:text-yellow-100 hover:underline transition-colors duration-200"
            >
              {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
            </a>
          </div>
          
          <button
            type="submit"
            className="mt-4 bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 hover:shadow-xl transition-all transform duration-200"
            disabled={loading}
          >
            {loading 
              ? (language === 'hi' ? "लॉगिन हो रहा है..." : "Logging in...") 
              : (language === 'hi' ? "लॉगिन" : "Login")
            }
          </button>
        </form>
        
        {/* Google Login Button */}
        <button
          onClick={() => signIn('google', { redirect: false })}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-2xl py-3 shadow-md hover:bg-gray-50 hover:shadow-lg transition-all duration-200 text-gray-800 font-semibold"
          type="button"
        >
          <img src="/google.svg" alt="Google" className="w-5 h-5" />
          {language === 'hi' ? 'Google से लॉगिन करें' : 'Login with Google'}
        </button>
        
        {error && <p className="mt-4 text-red-300 font-semibold bg-red-900/30 p-3 rounded-xl border border-red-400">{error}</p>}
        {success && (
          <p className="mt-4 text-green-300 font-semibold bg-green-900/30 p-3 rounded-xl border border-green-400">{success}</p>
        )}
        
        <p className="mt-6 text-sm text-white">
          {language === 'hi' ? "खाता नहीं है?" : "Don't have an account?"}{" "}
          <a
            href="/signup"
            className="text-yellow-300 font-bold hover:text-yellow-100 hover:underline transition-colors duration-200"
          >
            {language === 'hi' ? "साइन अप करें" : "Sign up"}
          </a>
        </p>
        
        <div className="mt-4 text-xs text-white/80 text-center bg-black/10 p-3 rounded-xl backdrop-blur-sm">
          {language === 'hi' 
            ? 'फोन नंबर के बिना +91 लिखें। ईमेल या फोन दोनों से लॉगिन कर सकते हैं।'
            : 'Enter phone number without +91. You can login with either email or phone.'
          }
        </div>
      </main>
      <style jsx global>{`
        .font-inter {
          font-family: "Inter", sans-serif;
        }
        .font-poppins,
        .hero-title {
          font-family: "Poppins", sans-serif;
        }
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

export default Login; 