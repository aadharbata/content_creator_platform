import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // const res = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(form),
      // });
      // const data = await res.json();
      // if (res.ok && data.token) {
      //   localStorage.setItem("token", data.token);
      //   setSuccess("Login successful! Redirecting...");
      //   setTimeout(() => router.push("/"), 1500);
      // } else {
      //   setError(data.message || "Login failed.");
      // }
      const res = await axios.post(
        "http://localhost:5000/auth/login",
        {
          email: form.email,
          password: form.password
        },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Response from login: ", res);
      const data = res.data;
      if (res.status===200 && data.token){
        localStorage.setItem("token", data.token);
        setSuccess("Login Successfull Redirecting...");
        setTimeout(()=>router.push("/"), 1500);
      }
    } catch (err) {
      setError("Server error.");
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
          Login
        </h1>
        <p className="text-md text-gray-700 mb-6">
          Welcome back! Please login to your account.
        </p>
        <form
          className="w-full flex flex-col gap-4 text-left"
          onSubmit={handleSubmit}
        >
          <label className="font-semibold text-gray-800">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
              required
              className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </label>
          <label className="font-semibold text-gray-800">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </label>
          <button
            type="submit"
            className="mt-4 bg-gradient-to-r from-blue-600 via-orange-400 to-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:scale-105 transition transform duration-200"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
        {success && (
          <p className="mt-4 text-green-600 font-semibold">{success}</p>
        )}
        <p className="mt-6 text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="text-orange-500 font-semibold hover:underline"
          >
            Sign up
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

export default Login;
