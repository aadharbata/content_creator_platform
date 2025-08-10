'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { signIn } from 'next-auth/react';
import { Mail, Phone, User, Lock, Eye, EyeOff, ArrowRight, Moon, ArrowLeft } from 'lucide-react';

const countryCodes = [
  { code: "+1", name: "US/Canada", flag: "🇺🇸" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
];

const SignUpForm = () => {
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [role, setRole] = useState<'CREATOR' | 'CONSUMER' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [otpData, setOtpData] = useState({
    phone: "",
    otp: "",
    userId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();
  const searchParams = useSearchParams();

  // Get role from URL params
  useEffect(() => {
    const roleParam = searchParams.get('role') as 'CREATOR' | 'CONSUMER';
    if (roleParam && ['CREATOR', 'CONSUMER'].includes(roleParam)) {
      setRole(roleParam);
    } else {
      // Redirect to role selection if no valid role
      router.push('/signup');
    }
  }, [searchParams, router]);

  // Dark mode effect
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

  // Timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtpData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError(language === 'hi' ? "नाम आवश्यक है" : "Name is required");
      return false;
    }

    if (signupMethod === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError(language === 'hi' ? "वैध ईमेल दर्ज करें" : "Please enter a valid email");
        return false;
      }
    } else {
      if (form.phone.length !== 10 || !/^[6-9]/.test(form.phone)) {
        setError(
          language === 'hi'
            ? "वैध भारतीय मोबाइल नंबर दर्ज करें (6,7,8,9 से शुरू होने वाला 10 अंकों का)"
            : "Please enter a valid Indian mobile number (10 digits starting with 6,7,8,9)"
        );
        return false;
      }
    }

    if (form.password.length < 6) {
      setError(language === 'hi' ? "पासवर्ड कम से कम 6 अक्षर का होना चाहिए" : "Password must be at least 6 characters");
      return false;
    }

    if (form.password !== form.confirm_password) {
      setError(language === 'hi' ? "पासवर्ड मेल नहीं खाते" : "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !role) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        email: signupMethod === "email" ? form.email : "",
        phone: signupMethod === "phone" ? form.phone : "",
        countryCode: form.countryCode,
        password: form.password,
        role,
        signupMethod,
      };

      console.log("Signup payload:", payload);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Signup response:", data);

      if (response.ok) {
        if (signupMethod === "phone") {
          setStep("otp");
          setOtpData({
            phone: form.countryCode + form.phone,
            otp: "",
            userId: data.user.id,
          });
          setSuccess(
            language === 'hi'
              ? `OTP भेजा गया ${form.countryCode}${form.phone} पर। कृपया OTP दर्ज करें।`
              : `OTP sent to ${form.countryCode}${form.phone}. Please enter the OTP.`
          );
          setResendTimer(30);
        } else {
          setSuccess(
            language === 'hi'
              ? "✅ खाता सफलतापूर्वक बनाया गया! लॉगिन पेज पर जा रहे हैं..."
              : "✅ Account created successfully! Redirecting to login page..."
          );
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        }
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError(
        language === 'hi'
          ? "नेटवर्क एरर। कृपया दुबारा कोशिश करें।"
          : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpData.otp.trim()) {
      setError(language === 'hi' ? "OTP दर्ज करें" : "Please enter OTP");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      const response = await fetch("/api/delivery/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: otpData.phone,
          otp: otpData.otp,
          purpose: "PHONE_VERIFICATION",
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setSuccess(
          language === 'hi'
            ? "✅ फोन सत्यापित हुआ! लॉगिन पेज पर जा रहे हैं..."
            : "✅ Phone verified! Redirecting to login page..."
        );
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(language === 'hi' ? "OTP सत्यापन में त्रुटि" : "OTP verification error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !otpData.phone) return;

    setResendLoading(true);
    try {
      const response = await fetch("/api/delivery/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: otpData.phone,
          purpose: "PHONE_VERIFICATION",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(language === 'hi' ? "OTP दुबारा भेजा गया" : "OTP resent successfully");
        setResendTimer(30);
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError(language === 'hi' ? "OTP भेजने में त्रुटि" : "Error sending OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!role) return;
    
    try {
      await fetch('/api/auth/google-signup-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      const callbackUrl = role === 'CREATOR' 
        ? `${window.location.origin}/creator/dashboard`
        : `${window.location.origin}/consumer-channel`;
      
      console.log(`🔐 Starting Google signup for ${role} with callbackUrl:`, callbackUrl);
      
      await signIn('google', { 
        redirect: true,
        callbackUrl
      });
    } catch (error) {
      console.error('Error initiating Google signup:', error);
      setError(language === 'hi' ? 'Google signup में त्रुटि' : 'Error with Google signup');
    }
  };

  if (!role) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
      }`}>
        <div className={`text-xl transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>Loading...</div>
      </div>
    );
  }

  const getRoleDisplayName = () => {
    if (role === 'CREATOR') {
      return language === 'hi' ? 'Creator' : 'Creator';
    }
    return language === 'hi' ? 'Fan' : 'Fan';
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-2 py-8 font-inter transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
    }`}>
      {/* Go Back button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push('/signup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Go Back</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <div className="flex space-x-2 mb-2">
          <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        </div>
        <span className={`text-xs font-medium transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Step 2 of 2
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

        {step === "signup" ? (
          <>
            <h1 className={`text-3xl md:text-4xl font-black mb-2 tracking-tight transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            } font-poppins`}>
              {language === 'hi' ? 'Sign up' : 'Sign up'}
            </h1>
            <p className={`text-md mb-8 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {language === 'hi' 
                ? `${getRoleDisplayName()} के रूप में खाता बनाएं`
                : `Create your account as a ${getRoleDisplayName()}`
              }
            </p>

            {/* Signup Method Toggle */}
            <div className={`flex w-full mb-6 rounded-xl p-1 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <button
                type="button"
                onClick={() => setSignupMethod("email")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  signupMethod === "email"
                    ? isDarkMode
                      ? 'bg-gray-600 text-purple-400 shadow-md'
                      : 'bg-white text-purple-600 shadow-md'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-600'
                      : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                {language === 'hi' ? 'ईमेल' : 'Email'}
              </button>
              <button
                type="button"
                onClick={() => setSignupMethod("phone")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  signupMethod === "phone"
                    ? isDarkMode
                      ? 'bg-gray-600 text-purple-400 shadow-md'
                      : 'bg-white text-purple-600 shadow-md'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-600'
                      : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Phone className="w-4 h-4 inline mr-2" />
                {language === 'hi' ? 'फोन' : 'Phone'}
              </button>
            </div>

            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="relative">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {language === 'hi' ? 'नाम' : 'Name'}
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={language === 'hi' ? 'आपका नाम' : 'Your name'}
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {signupMethod === "email" ? (
                <div className="relative">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {language === 'hi' ? 'ईमेल' : 'Email'}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder={language === 'hi' ? 'आप@email.com' : 'you@email.com'}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      value={form.countryCode}
                      onChange={handleChange}
                      className={`px-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-gray-300'
                      }`}
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        required
                        maxLength={10}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                  <p className={`text-xs mt-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {language === 'hi'
                      ? 'केवल 10 अंक (6,7,8,9 से शुरू)'
                      : 'Only 10 digits (starting with 6,7,8,9)'
                    }
                  </p>
                </div>
              )}

              <div className="relative">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {language === 'hi' ? 'पासवर्ड' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder={language === 'hi' ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (at least 6 characters)'}
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
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {language === 'hi' ? 'पासवर्ड कन्फर्म करें' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <input
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder={language === 'hi' ? 'पासवर्ड दुबारा लिखें' : 'Re-enter password'}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200 flex items-center justify-center space-x-2"
                disabled={loading}
              >
                <span>
                  {loading
                    ? (language === 'hi' ? "बन रहा है..." : "Creating...")
                    : (language === 'hi' ? "खाता बनाएं" : "Create Account")
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              className={`mt-4 w-full flex items-center justify-center gap-2 border rounded-2xl py-3 shadow hover:scale-105 transition-all duration-200 font-semibold ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'
              }`}
              type="button"
            >
              <img src="/google.svg" alt="Google" className="w-5 h-5" />
              {language === 'hi' ? 'Google से Sign up करें' : 'Sign up with Google'}
            </button>

            {error && <p className={`mt-4 font-semibold p-3 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'text-red-400 bg-red-900/30 border-red-700' 
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>{error}</p>}
            {success && <p className={`mt-4 font-semibold p-3 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'text-green-400 bg-green-900/30 border-green-700' 
                : 'text-green-600 bg-green-50 border-green-200'
            }`}>{success}</p>}

            <p className={`mt-6 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {language === 'hi' ? "पहले से खाता है?" : "Already have an account?"}{" "}
              <a
                href="/login"
                className="text-purple-600 font-semibold hover:text-purple-800 hover:underline transition-colors duration-200"
              >
                {language === 'hi' ? "लॉगिन करें" : "Sign in"}
              </a>
            </p>
          </>
        ) : (
          /* OTP Verification Step */
          <>
            <h1 className={`text-3xl md:text-4xl font-black mb-4 tracking-tight transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            } font-poppins`}>
              {language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification'}
            </h1>
            <p className={`text-md mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {language === 'hi'
                ? `OTP भेजा गया ${otpData.phone} पर`
                : `OTP sent to ${otpData.phone}`
              }
            </p>

            <form className="w-full flex flex-col gap-4" onSubmit={handleOtpSubmit}>
              <div className="relative">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'}
                </label>
                <input
                  name="otp"
                  type="text"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                  placeholder={language === 'hi' ? '6 अंकों का OTP' : '6-digit OTP'}
                  required
                  maxLength={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-center text-2xl tracking-widest transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200"
                disabled={otpLoading}
              >
                {otpLoading
                  ? (language === 'hi' ? "सत्यापित हो रहा..." : "Verifying...")
                  : (language === 'hi' ? "OTP सत्यापित करें" : "Verify OTP")
                }
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || resendLoading}
                className={`mt-2 py-2 px-4 rounded-xl font-semibold transition ${
                  resendTimer > 0 || resendLoading
                    ? isDarkMode
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {resendLoading
                  ? (language === 'hi' ? "भेजा जा रहा..." : "Sending...")
                  : resendTimer > 0
                  ? (language === 'hi' ? `दुबारा भेजें (${resendTimer}s)` : `Resend (${resendTimer}s)`)
                  : (language === 'hi' ? "दुबारा भेजें" : "Resend OTP")
                }
              </button>
            </form>

            {error && <p className={`mt-4 font-semibold p-3 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'text-red-400 bg-red-900/30 border-red-700' 
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>{error}</p>}
            {success && <p className={`mt-4 font-semibold p-3 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'text-green-400 bg-green-900/30 border-green-700' 
                : 'text-green-600 bg-green-50 border-green-200'
            }`}>{success}</p>}

            <button
              onClick={() => setStep("signup")}
              className={`mt-4 text-sm hover:underline transition-colors duration-200 ${
                isDarkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              ← {language === 'hi' ? 'वापस जाएं' : 'Go back'}
            </button>
          </>
        )}

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

export default SignUpForm; 