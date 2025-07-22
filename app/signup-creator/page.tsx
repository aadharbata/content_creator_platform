'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const countryCodes = [
  { code: "+1", name: "US/Canada", flag: "🇺🇸" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  // Add more as needed
];

const SignUpCreator = () => {
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"signup" | "otp">("signup");
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

  // Timer effect for OTP resend
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Start timer when OTP step is reached
  React.useEffect(() => {
    if (step === "otp") {
      setResendTimer(60); // 60 seconds timer
    }
  }, [step]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtpData({ ...otpData, [e.target.name]: e.target.value });
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

    // Validation
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

    if (form.password.length < 6) {
      setError(language === 'hi' ? "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।" : "Password must be at least 6 characters.");
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
          phone: form.phone,
          countryCode: form.countryCode,
          password: form.password,
          role: 'CREATOR',
          signupMethod: signupMethod
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requiresOTP) {
          // Phone signup - move to OTP verification step
          setOtpData({
            phone: data.phone,
            otp: "",
            userId: data.user.id,
          });
          setStep("otp");
          setSuccess(language === 'hi' ? "OTP आपके फोन पर भेजा गया है।" : "OTP sent to your phone.");
          console.log('Development OTP:', data.otp); // Log OTP for development
        } else {
          // Email signup - redirect to login
          setSuccess(language === 'hi' ? "साइन अप सफल! लॉगिन पेज पर जा रहे हैं..." : "Sign up successful! Redirecting to login...");
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        }
      } else {
        setError(data.message || (language === 'hi' ? "साइन अप विफल।" : "Sign up failed."));
      }
    } catch (error) {
      setError(language === 'hi' ? "सर्वर त्रुटि।" : "Server error.");
    }

    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpData.otp) {
      setError(language === 'hi' ? "OTP आवश्यक है।" : "OTP is required.");
      return;
    }

    if (otpData.otp.length !== 6) {
      setError(language === 'hi' ? "OTP 6 अंकों का होना चाहिए।" : "OTP must be 6 digits.");
      return;
    }

    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: otpData.phone,
          otp: otpData.otp,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(language === 'hi' ? "फोन सत्यापित! लॉगिन पेज पर जा रहे हैं..." : "Phone verified! Redirecting to login...");
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError(data.message || (language === 'hi' ? "OTP सत्यापन विफल।" : "OTP verification failed."));
      }
    } catch (error) {
      setError(language === 'hi' ? "सर्वर त्रुटि।" : "Server error.");
    }

    setOtpLoading(false);
  };

  const resendOTP = async () => {
    if (resendTimer > 0) {
      setError(language === 'hi' ? `${resendTimer} सेकंड में पुनः प्रयास करें।` : `Try again in ${resendTimer} seconds.`);
      return;
    }

    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      const res = await fetch('/api/delivery/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: otpData.phone,
          purpose: 'PHONE_VERIFICATION',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(language === 'hi' ? "नया OTP भेजा गया।" : "New OTP sent.");
        setResendTimer(60); // Reset timer to 60 seconds
        console.log('Development OTP:', data.otp); // Log OTP for development
      } else {
        setError(data.error || (language === 'hi' ? "OTP भेजने में विफल।" : "Failed to send OTP."));
      }
    } catch (error) {
      setError(language === 'hi' ? "सर्वर त्रुटि।" : "Server error.");
    }

    setResendLoading(false);
  };

  const goBackToSignup = () => {
    setStep("signup");
    setOtpData({ phone: "", otp: "", userId: "" });
    setError("");
    setSuccess("");
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
          {step === "signup" 
            ? (language === 'hi' ? 'क्रिएटर साइन अप' : 'Creator Sign Up')
            : (language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification')
          }
        </h1>
        <p className="text-md text-gray-700 mb-6">
          {step === "signup" 
            ? (language === 'hi' 
                ? 'एक क्रिएटर के रूप में शामिल हों और अपनी सामग्री साझा करना शुरू करें!' 
                : 'Join as a creator and start sharing your content!'
              )
            : (language === 'hi' 
                ? 'अपने फोन पर भेजा गया OTP दर्ज करें।' 
                : 'Enter the OTP sent to your phone.'
              )
          }
        </p>
        
        {step === "signup" ? (
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
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none"
                    placeholder={language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                  />
                </div>
              </label>
            )}
            
            <label className="font-semibold text-gray-800">
              {language === 'hi' ? 'पासवर्ड' : 'Password'}
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={language === 'hi' ? 'पासवर्ड' : 'Password'}
                required
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </label>
            <label className="font-semibold text-gray-800">
              {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              <input
                name="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder={language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                required
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </label>
            <button
              type="submit"
              className="mt-4 bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200"
              disabled={loading}
            >
              {loading 
                ? (language === 'hi' ? "साइन अप हो रहा है..." : "Signing up...") 
                : (language === 'hi' ? "क्रिएटर के रूप में साइन अप करें" : "Sign Up as Creator")
              }
            </button>
          </form>
        ) : (
          <form
            className="w-full flex flex-col gap-4 text-left"
            onSubmit={handleOtpSubmit}
          >
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">
                {language === 'hi' ? 'OTP भेजा गया:' : 'OTP sent to:'} <strong>{otpData.phone}</strong>
              </p>
            </div>
            
            <label className="font-semibold text-gray-800">
              {language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'}
              <input
                type="text"
                name="otp"
                value={otpData.otp}
                onChange={handleOtpChange}
                required
                maxLength={6}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-center text-lg tracking-widest"
                placeholder="000000"
              />
            </label>

            <button
              type="submit"
              className="mt-4 bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200"
              disabled={otpLoading}
            >
              {otpLoading 
                ? (language === 'hi' ? "सत्यापित हो रहा है..." : "Verifying...") 
                : (language === 'hi' ? "सत्यापित करें" : "Verify")
              }
            </button>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={resendOTP}
                className={`flex-1 font-semibold py-2 rounded-xl transition-colors ${
                  resendTimer > 0 || resendLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                disabled={resendTimer > 0 || resendLoading}
              >
                {resendLoading
                  ? (language === 'hi' ? 'भेजा जा रहा है...' : 'Sending...')
                  : resendTimer > 0
                  ? (language === 'hi' ? `पुनः भेजें (${resendTimer}s)` : `Resend (${resendTimer}s)`)
                  : (language === 'hi' ? 'पुनः भेजें' : 'Resend OTP')
                }
              </button>
              <button
                type="button"
                onClick={goBackToSignup}
                className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 rounded-xl hover:bg-gray-300 transition-colors"
              >
                {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
              </button>
            </div>
          </form>
        )}

        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
        {success && (
          <p className="mt-4 text-green-600 font-semibold">{success}</p>
        )}
        
        {step === "signup" && (
          <p className="mt-6 text-sm text-gray-600">
            {language === 'hi' ? "पहले से खाता है?" : "Already have an account?"}{" "}
            <a
              href="/login"
              className="text-orange-500 font-semibold hover:underline"
            >
              {language === 'hi' ? "लॉगिन करें" : "Login"}
            </a>
          </p>
        )}
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

export default SignUpCreator; 