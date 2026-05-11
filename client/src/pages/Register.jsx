import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    phone: "" 
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🔥 VALIDATION: Only allow numbers in the phone field
    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, '');
      setForm({ ...form, [name]: onlyNums });
    } else {
      setForm({ ...form, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Deep Validation
    let validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) validationErrors.name = "Full name is required.";
    if (!emailRegex.test(form.email)) validationErrors.email = "Enter a valid email.";
    if (form.phone.length < 10) validationErrors.phone = "Enter a valid 10-digit number.";
    if (form.password.length < 6) validationErrors.password = "Password must be at least 6 characters.";
    if (!form.role) validationErrors.role = "Please select your role.";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/auth/register", form);
      alert("Registered Successfully ✅");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8FAFC] font-sans">
      
      {/* Left Side: Hero Brand Section (Rich Green Gradient) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011c15] relative overflow-hidden">
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
          <span className="text-[#34d399] text-sm font-semibold tracking-widest uppercase bg-[#022c22]/50 px-3 py-1 rounded-full border border-[#064e3b]">Level Up Your Game</span>
          <h1 className="text-white text-5xl font-extrabold leading-tight mt-4 mb-4">
            Join the elite circle of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34d399] to-[#a7f3d0]">sports excellence.</span>
          </h1>
          <p className="text-emerald-100/70 text-lg leading-relaxed">
            Create an account to start scheduling training, evaluating tactics, and dominating leaderboards.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-emerald-100/40 text-sm relative z-10">
          © 2026 SportoTrack. Driven by Athletes.
        </div>
      </div>

      {/* Right Side: Form Area (Crisp Premium White) */}
      <div className="flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative">
          
          <div className="text-center mb-6">
            <h2 className="text-[#0f172a] text-3xl font-bold tracking-tight">Create Account</h2>
            <p className="text-[#64748b] mt-2">Join athletes and professionals today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Grid for Name and Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[#475569] text-sm font-medium block mb-2">Full Name</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  placeholder="John Doe"
                  onChange={handleChange}
                  className={`w-full bg-[#f8fafc] border ${errors.name ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-[#10b981]"} text-[#0f172a] placeholder-[#94a3b8] py-3 px-4 rounded-xl outline-none transition-all`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-[#475569] text-sm font-medium block mb-2">Phone Number</label>
                <input
                  name="phone"
                  type="text"
                  value={form.phone}
                  placeholder="Only numbers"
                  onChange={handleChange}
                  className={`w-full bg-[#f8fafc] border ${errors.phone ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-[#10b981]"} text-[#0f172a] placeholder-[#94a3b8] py-3 px-4 rounded-xl outline-none transition-all`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="text-[#475569] text-sm font-medium block mb-2">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                placeholder="name@example.com"
                onChange={handleChange}
                className={`w-full bg-[#f8fafc] border ${errors.email ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-[#10b981]"} text-[#0f172a] placeholder-[#94a3b8] py-3 px-4 rounded-xl outline-none transition-all`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label className="text-[#475569] text-sm font-medium block mb-2">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                placeholder="Min. 6 characters"
                onChange={handleChange}
                className={`w-full bg-[#f8fafc] border ${errors.password ? "border-red-400 focus:border-red-500" : "border-[#e2e8f0] focus:border-[#10b981]"} text-[#0f172a] placeholder-[#94a3b8] py-3 px-4 rounded-xl outline-none transition-all`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-[#475569] text-sm font-medium block mb-2">Select Your Role</label>
              <div className="grid grid-cols-3 gap-3">
                {["player", "coach", "analyst"].map((roleOption) => (
                  <label 
                    key={roleOption} 
                    className={`cursor-pointer border py-3 px-2 rounded-xl text-center capitalize transition-all ${
                      form.role === roleOption 
                        ? "bg-gradient-to-r from-[#059669] to-[#10b981] border-transparent text-white font-bold shadow-md shadow-emerald-100" 
                        : "bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleOption}
                      onChange={handleChange}
                      className="hidden"
                    />
                    {roleOption}
                  </label>
                ))}
              </div>
              {errors.role && <p className="text-red-500 text-xs mt-2">{errors.role}</p>}
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold tracking-wide mt-2 transition-all shadow-lg ${
                loading 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] shadow-emerald-200/50"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registering...
                </div>
              ) : "Create Account"}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center text-sm">
            <p className="text-[#64748b]">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/")}
                className="text-[#059669] font-semibold cursor-pointer hover:text-[#047857] transition-colors hover:underline"
              >
                Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;