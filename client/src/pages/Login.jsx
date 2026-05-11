import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear errors when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Quick Validation
    let validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(form.email)) {
      validationErrors.email = "Please enter a valid email address.";
    }
    if (form.password.length < 6) {
      validationErrors.password = "Password must be at least 6 characters.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "https://sporto-track.onrender.com/api/auth/login",
        form
      );
      alert(res.data.message);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;
      if (role === "player") navigate("/player");
      if (role === "coach") navigate("/coach");
      if (role === "analyst") navigate("/analyst");

    } catch (error) {
      alert(error.response?.data?.message || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8FAFC] font-sans">
      
      {/* Left Side: Hero Brand Section (Rich Green Gradient) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011c15] relative overflow-hidden">
        {/* Abstract glowing shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#10b981]/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#059669]/10 rounded-full blur-3xl"></div>
        
        {/* Logo */}
        <div className="flex items-center space-x-2 relative z-10">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#10b981] to-[#34d399] rounded-lg transform rotate-12 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            S
          </div>
          <span className="text-white font-bold text-xl tracking-wider">SPORTO<span className="text-[#34d399]">TRACK</span></span>
        </div>

        {/* Hero Text */}
        <div className="max-w-md relative z-10">
          <span className="text-[#34d399] text-sm font-semibold tracking-widest uppercase bg-[#022c22]/50 px-3 py-1 rounded-full border border-[#064e3b]">Performance Redefined</span>
          <h1 className="text-white text-5xl font-extrabold leading-tight mt-4 mb-4">
            Where sweat meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34d399] to-[#a7f3d0]">science.</span>
          </h1>
          <p className="text-emerald-100/70 text-lg leading-relaxed">
            Track metrics, analyze gameplay, and scale your athletic potential with state-of-the-art sports tracking.
          </p>
        </div>

        {/* Footer info or stats */}
        <div className="text-emerald-100/40 text-sm relative z-10">
          © 2026 SportoTrack. Driven by Athletes.
        </div>
      </div>

      {/* Right Side: Form Area (Crisp Premium White) */}
      <div className="flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative">
          
          <div className="text-center mb-8">
            <h2 className="text-[#0f172a] text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-[#64748b] mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="text-[#475569] text-sm font-medium block mb-2">Email Address</label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  onChange={handleChange}
                  className={`w-full bg-[#f8fafc] border ${errors.email ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-[#10b981]"} text-[#0f172a] placeholder-[#94a3b8] py-3 px-4 rounded-xl outline-none transition-all`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-[#475569] text-sm font-medium block mb-2">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  className={`w-full bg-[#f8fafc] border ${errors.password ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-[#10b981]"} text-[#0f172a] placeholder-[#94a3b8] py-3 px-4 rounded-xl outline-none transition-all`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold tracking-wide transition-all shadow-lg ${
                loading 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] shadow-emerald-200/50"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </div>
              ) : "Sign In"}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-sm">
            <p className="text-[#64748b]">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-[#059669] font-semibold cursor-pointer hover:text-[#047857] transition-colors hover:underline"
              >
                Create one free
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;