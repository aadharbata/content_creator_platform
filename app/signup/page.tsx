'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { signIn } from "next-auth/react";

const countryCodes = [
  { code: "+1", name: "US/Canada", flag: "🇺🇸" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  // Add more as needed
];

const SignUp = () => {
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    phone: "",
    password: "",
    confirm_password: "",
    role: 'CREATOR',
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignupMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupMethod(e.target.value as "email" | "phone");
    setForm({ ...form, email: "", phone: "" }); // Clear the other field
    setError("");
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\d{6,15}$/.test(phone.replace(/\D/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (signupMethod === "email") {
      if (!form.email) {
        setError(language === 'hi' ? "ईमेल आवश्यक है।" : "Email is required.");
        return;
      }
      if (!validateEmail(form.email)) {
        setError(language === 'hi' ? "कृपया एक वैध ईमेल पता दर्ज करें।" : "Please enter a valid email address.");
        return;
      }
    } else {
      if (!form.phone) {
        setError(language === 'hi' ? "फोन नंबर आवश्यक है।" : "Phone number is required.");
        return;
      }
      if (!validatePhone(form.phone)) {
        setError(language === 'hi' ? "कृपया एक वैध फोन नंबर दर्ज करें।" : "Please enter a valid phone number.");
        return;
      }
      if (!form.countryCode) {
        setError(language === 'hi' ? "कृपया एक देश कोड चुनें।" : "Please select a country code.");
        return;
      }
    }
    if (form.password !== form.confirm_password) {
      setError(language === 'hi' ? "पासवर्ड मेल नहीं खाते।" : "Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(language === 'hi' ? "साइन अप सफल! अब आपको लॉगिन किया जा रहा है..." : "Sign up successful! Logging you in...");
        
        // Automatically sign in the user after successful registration
        const signInResult = await signIn('credentials', {
          redirect: false,
          email: form.email,
          password: form.password,
        });

        if (signInResult?.ok) {
          // Redirect to home or dashboard
          router.push('/home');
        } else {
          // If auto-login fails, redirect to login page as a fallback
          setError(language === 'hi' ? "स्वतः लॉगिन विफल। कृपया मैन्युअल रूप से लॉगिन करें।" : "Auto-login failed. Please log in manually.");
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        setError(data.message || (language === 'hi' ? "साइन अप विफल।" : "Sign up failed."));
      }
    } catch (error) {
      setError(language === 'hi' ? "सर्वर त्रुटि।" : "Server error.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-400 flex flex-col justify-center items-center px-2 py-8 font-inter">
      <main className="w-full max-w-md mx-auto glass p-8 md:p-12 mt-10 mb-8 flex flex-col items-center text-center">
        <div className="bg-gradient-to-tr from-blue-500 via-orange-400 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-4 border-white mb-4">
          <span className="text-white text-2xl font-extrabold tracking-widest">
            CP
          </span>
        </div>
        <h1 className="hero-title text-3xl md:text-4xl font-black mb-2 tracking-tight text-blue-900 font-poppins">
          {language === 'hi' ? 'साइन अप' : 'Sign Up'}
        </h1>
        <p className="text-md text-gray-700 mb-6">
          {language === 'hi' 
            ? 'हमारे प्लेटफॉर्म में शामिल हों और अपनी यात्रा शुरू करें!' 
            : 'Join our platform and start your journey!'
          }
        </p>
        <form
          className="w-full flex flex-col gap-4 text-left"
          onSubmit={handleSubmit}
        >
          <label className="font-semibold text-gray-800">
            {language === 'hi' ? 'नाम' : 'Name'}
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder={language === 'hi' ? 'नाम' : 'Name'}
            />
          </label>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="font-semibold text-gray-800 mb-2 block">
              {language === 'hi' ? 'मैं इस रूप में शामिल होना चाहता हूं:' : 'I want to join as:'}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="CREATOR"
                  checked={form.role === "CREATOR"}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                <span className="text-gray-800">{language === 'hi' ? 'क्रिएटर' : 'Creator'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="CONSUMER"
                  checked={form.role === "CONSUMER"}
                  onChange={handleChange}
                  className="accent-orange-500"
                />
                <span className="text-gray-800">{language === 'hi' ? 'उपभोक्ता' : 'Consumer'}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 items-center mb-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="signupMethod"
                value="email"
                checked={signupMethod === "email"}
                onChange={handleSignupMethodChange}
                className="accent-blue-600"
              />
              <span className="text-gray-800">{language === 'hi' ? 'ईमेल से साइन अप करें' : 'Sign up with Email'}</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="signupMethod"
                value="phone"
                checked={signupMethod === "phone"}
                onChange={handleSignupMethodChange}
                className="accent-orange-500"
              />
              <span className="text-gray-800">{language === 'hi' ? 'फोन से साइन अप करें' : 'Sign up with Phone'}</span>
            </label>
          </div>
          {signupMethod === "email" ? (
            <label className="font-semibold text-gray-800">
              {language === 'hi' ? 'ईमेल' : 'Email'}
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder={language === 'hi' ? 'ईमेल' : 'Email'}
              />
            </label>
          ) : (
            <label className="font-semibold text-gray-800">
              {language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
              <div className="flex gap-2 mt-1">
                <select
                  name="countryCode"
                  value={form.countryCode}
                  onChange={handleChange}
                  className="px-2 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.name})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder={language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                />
              </div>
            </label>
          )}
          <label className="font-semibold text-gray-800">
            {language === 'hi' ? 'पासवर्ड' : 'Password'}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder={language === 'hi' ? 'पासवर्ड' : 'Password'}
            />
          </label>
          <label className="font-semibold text-gray-800">
            {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder={language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
            />
          </label>

          <button
            type="submit"
            className="mt-4 bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200"
            disabled={loading}
          >
            {loading 
              ? (language === 'hi' ? "साइन अप हो रहा है..." : "Signing up...") 
              : (language === 'hi' ? "साइन अप" : "Sign Up")
            }
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
        {success && (
          <p className="mt-4 text-green-600 font-semibold">{success}</p>
        )}
        <p className="mt-6 text-sm text-gray-600">
          {language === 'hi' ? "पहले से ही खाता है?" : "Already have an account?"}{" "}
          <a
            href="/login"
            className="text-orange-500 font-semibold hover:underline"
          >
            {language === 'hi' ? "साइन इन करें" : "Sign in"}
          </a>
        </p>
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
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
          backdrop-filter: blur(8px);
          border-radius: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
      `}</style>
    </div>
  );
};

export default SignUp; 