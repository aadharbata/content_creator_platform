'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { signIn } from 'next-auth/react';

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
        role, // Use the selected role
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
          // Phone signup - go to OTP verification
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
          // Email signup - direct success
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

  // Google OAuth signup with role
  const handleGoogleSignup = async () => {
    if (!role) return;
    
    try {
      // Store role in server-side cookie for OAuth flow
      await fetch('/api/auth/google-signup-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      // Build callback URL for final redirection
      const callbackUrl = role === 'CREATOR' 
        ? `${window.location.origin}/creator/dashboard`
        : `${window.location.origin}/consumer-channel`;
      
      console.log(`🔐 Starting Google signup for ${role} with callbackUrl:`, callbackUrl);
      
      // Initiate Google OAuth
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-400 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-400 flex flex-col justify-center items-center px-2 py-8 font-inter">
      <main className="w-full max-w-md mx-auto glass p-8 md:p-12 mt-10 mb-8 flex flex-col items-center text-center">
        <div className="bg-gradient-to-tr from-blue-500 via-orange-400 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-4 border-white mb-4">
          <span className="text-white text-2xl font-extrabold tracking-widest">
            CP
          </span>
        </div>

        {step === "signup" ? (
          <>
            <h1 className="hero-title text-3xl md:text-4xl font-black mb-2 tracking-tight text-white font-poppins">
              {language === 'hi' ? 'Sign up' : 'Sign up'}
            </h1>
            <p className="text-md text-white mb-2">
              {language === 'hi' 
                ? `${getRoleDisplayName()} के रूप में खाता बनाएं`
                : `Create your account as a ${getRoleDisplayName()}`
              }
            </p>
            <p className="text-sm text-yellow-300 mb-6 font-semibold">
              {role === 'CREATOR' ? '👨‍💼 Creator Account' : '👤 Fan Account'}
            </p>

            {/* Signup Method Toggle */}
            <div className="flex w-full mb-6 bg-white/20 rounded-xl p-1 backdrop-blur-sm border border-white/30">
              <button
                type="button"
                onClick={() => setSignupMethod("email")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  signupMethod === "email"
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {language === 'hi' ? 'ईमेल' : 'Email'}
              </button>
              <button
                type="button"
                onClick={() => setSignupMethod("phone")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  signupMethod === "phone"
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {language === 'hi' ? 'फोन' : 'Phone'}
              </button>
            </div>

            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="font-semibold text-white">
                {language === 'hi' ? 'नाम' : 'Name'}
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'आपका नाम' : 'Your name'}
                  required
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none bg-white text-gray-800"
                />
              </label>

              {signupMethod === "email" ? (
                <label className="font-semibold text-white">
                  {language === 'hi' ? 'ईमेल' : 'Email'}
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={language === 'hi' ? 'आप@email.com' : 'you@email.com'}
                    required
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none bg-white text-gray-800"
                  />
                </label>
              ) : (
                <label className="font-semibold text-white">
                  {language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                  <div className="mt-1 flex gap-2">
                    <select
                      name="countryCode"
                      value={form.countryCode}
                      onChange={handleChange}
                      className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none bg-white text-gray-800"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      required
                      maxLength={10}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none bg-white text-gray-800"
                    />
                  </div>
                  <div className="text-xs text-gray-200 mt-1 bg-black/20 p-2 rounded-lg backdrop-blur-sm">
                    {language === 'hi'
                      ? 'केवल 10 अंक (6,7,8,9 से शुरू)'
                      : 'Only 10 digits (starting with 6,7,8,9)'
                    }
                  </div>
                </label>
              )}

              <label className="font-semibold text-white">
                {language === 'hi' ? 'पासवर्ड' : 'Password'}
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (at least 6 characters)'}
                  required
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none bg-white text-gray-800"
                />
              </label>

              <label className="font-semibold text-white">
                {language === 'hi' ? 'पासवर्ड कन्फर्म करें' : 'Confirm Password'}
                <input
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'पासवर्ड दुबारा लिखें' : 'Re-enter password'}
                  required
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none bg-white text-gray-800"
                />
              </label>

              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200"
                disabled={loading}
              >
                {loading
                  ? (language === 'hi' ? "बन रहा है..." : "Creating...")
                  : (language === 'hi' ? "खाता बनाएं" : "Create Account")
                }
              </button>
            </form>

            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-2xl py-3 shadow hover:bg-gray-100 transition-colors text-gray-800 font-semibold"
              type="button"
            >
              <img src="/google.svg" alt="Google" className="w-5 h-5" />
              {language === 'hi' ? 'Google से Sign up करें' : 'Sign up with Google'}
            </button>

            {error && <p className="mt-4 text-red-300 font-semibold bg-red-900/30 p-3 rounded-xl border border-red-400">{error}</p>}
            {success && <p className="mt-4 text-green-300 font-semibold bg-green-900/30 p-3 rounded-xl border border-green-400">{success}</p>}

            <p className="mt-6 text-sm text-white">
              {language === 'hi' ? "पहले से खाता है?" : "Already have an account?"}{" "}
              <a
                href="/login"
                className="text-yellow-300 font-bold hover:text-yellow-100 hover:underline transition-colors duration-200"
              >
                {language === 'hi' ? "लॉगिन करें" : "Sign in"}
              </a>
            </p>
          </>
        ) : (
          /* OTP Verification Step */
          <>
            <h1 className="hero-title text-3xl md:text-4xl font-black mb-4 tracking-tight text-white font-poppins">
              {language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification'}
            </h1>
            <p className="text-md text-white mb-6">
              {language === 'hi'
                ? `OTP भेजा गया ${otpData.phone} पर`
                : `OTP sent to ${otpData.phone}`
              }
            </p>

            <form className="w-full flex flex-col gap-4" onSubmit={handleOtpSubmit}>
              <label className="font-semibold text-white">
                {language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'}
                <input
                  name="otp"
                  type="text"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                  placeholder={language === 'hi' ? '6 अंकों का OTP' : '6-digit OTP'}
                  required
                  maxLength={6}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none text-center text-2xl tracking-widest bg-white text-gray-800"
                />
              </label>

              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200"
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
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-100"
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

            {error && <p className="mt-4 text-red-300 font-semibold bg-red-900/30 p-3 rounded-xl border border-red-400">{error}</p>}
            {success && <p className="mt-4 text-green-300 font-semibold bg-green-900/30 p-3 rounded-xl border border-green-400">{success}</p>}

            <button
              onClick={() => setStep("signup")}
              className="mt-4 text-sm text-white hover:text-yellow-300 hover:underline transition-colors duration-200"
            >
              ← {language === 'hi' ? 'वापस जाएं' : 'Go back'}
            </button>
          </>
        )}

        <div className="mt-4 text-xs text-white/80 text-center bg-black/20 p-3 rounded-xl backdrop-blur-sm">
          {language === 'hi'
            ? 'खाता बनाकर आप हमारी Terms of Service और Privacy Policy से सहमत हैं।'
            : 'By creating an account, you agree to our Terms of Service and Privacy Policy.'
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

export default SignUpForm; 