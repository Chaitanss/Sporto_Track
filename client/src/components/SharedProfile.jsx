import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SharedProfile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(storedUser);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    city: user?.city || "",
    dateOfBirth: user?.dateOfBirth || "",
    jerseyNumber: user?.jerseyNumber || "",
    position: user?.position || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "https://sporto-track.onrender.com/api/auth/update-profile",
        { name: form.name, email: form.email, phone: form.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setEditMode(false);
      alert("Profile Updated ✅");
    } catch {
      alert("Update failed ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Hard redirect to clear any lingering state
    window.location.href = "/";
  };

  const roleColors = {
    coach: { bg: "from-emerald-600 to-teal-700", accent: "#10b981", badge: "bg-emerald-100 text-emerald-700" },
    player: { bg: "from-blue-600 to-indigo-700", accent: "#3b82f6", badge: "bg-blue-100 text-blue-700" },
    analyst: { bg: "from-violet-600 to-purple-700", accent: "#8b5cf6", badge: "bg-violet-100 text-violet-700" },
  };

  const role = user?.role || "player";
  const colors = roleColors[role] || roleColors.player;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;

  const tabs = ["overview", "edit"];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── TOP HERO BANNER ── */}
      <div className={`bg-gradient-to-r ${colors.bg} h-48 relative`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-20 pb-16">

        {/* ── PROFILE CARD ── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Avatar + Name Row */}
          <div className="px-8 pt-6 pb-4 flex items-end gap-5">
            <div
              className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0 border-4 border-white`}
              style={{ marginTop: "-48px" }}
            >
              {initials}
            </div>

            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${colors.badge}`}>
                  {user?.role}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
            </div>

            {/* Action Buttons (Edit/Save only) */}
            <div className="flex gap-2 pb-1">
              {!editMode ? (
                <button
                  onClick={() => { setEditMode(true); setActiveTab("edit"); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: colors.accent }}
                >
                  ✏️ Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                    style={{ background: colors.accent }}
                  >
                    {saving ? "Saving..." : "💾 Save"}
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setActiveTab("overview"); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="px-8 border-b border-gray-100 flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if (tab !== "edit") setEditMode(false); }}
                className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-current text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                style={activeTab === tab ? { borderColor: colors.accent, color: colors.accent } : {}}
              >
                {tab === "overview" ? "👤 Overview" : "✏️ Edit Profile"}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", value: user?.name, icon: "👤" },
                  { label: "Email Address", value: user?.email, icon: "📧" },
                  { label: "Phone Number", value: user?.phone || "—", icon: "📱" },
                  { label: "Role", value: user?.role, icon: "🎯", capitalize: true },
                  { label: "City", value: form.city || "—", icon: "📍" },
                  { label: "Date of Birth", value: form.dateOfBirth || "—", icon: "🎂" },
                  ...(role === "player"
                    ? [
                        { label: "Jersey Number", value: form.jerseyNumber || "—", icon: "🔢" },
                        { label: "Position", value: form.position || "—", icon: "⚽" },
                      ]
                    : []),
                ].map(({ label, value, icon, capitalize }) => (
                  <div key={label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                      <p className={`text-sm font-semibold text-gray-800 ${capitalize ? "capitalize" : ""}`}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Bio full width */}
                {form.bio && (
                  <div className="sm:col-span-2 flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="text-xl">📝</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Bio</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{form.bio}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats strip + LOGOUT (Placed at the bottom grid to match your exact styling) */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  ...(memberSince ? [{ label: "Member Since", value: memberSince }] : []),
                  { label: "Account Status", value: user?.isActive === false ? "Inactive" : "Active" },
                  { label: "Role Level", value: user?.role === "coach" ? "Admin" : "Member" },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-gray-50 rounded-xl py-4">
                    <p className="text-base font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
                
                {/* Visual match to the active/admin blocks but triggers logout */}
                <button 
                  onClick={handleLogout}
                  className="text-center bg-red-50 hover:bg-red-100 transition-all rounded-xl py-4 border border-red-100"
                >
                  <p className="text-base font-bold text-red-600">🚪 Log Out</p>
                  <p className="text-xs text-red-400 mt-0.5">End Session</p>
                </button>
              </div>
            </div>
          )}

          {/* ── EDIT TAB ── */}
          {activeTab === "edit" && (
            <div className="px-8 py-6">
              <p className="text-sm text-gray-400 mb-5">
                Update your profile information below. Only <strong>Name</strong>, <strong>Email</strong> and <strong>Phone</strong> are saved to the server — the rest are stored locally.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "name", label: "Full Name", icon: "👤", type: "text" },
                  { name: "email", label: "Email Address", icon: "📧", type: "email" },
                  { name: "phone", label: "Phone Number", icon: "📱", type: "tel" },
                  { name: "city", label: "City", icon: "📍", type: "text" },
                  { name: "dateOfBirth", label: "Date of Birth", icon: "🎂", type: "date" },
                  ...(role === "player"
                    ? [
                        { name: "jerseyNumber", label: "Jersey Number", icon: "🔢", type: "number" },
                        { name: "position", label: "Playing Position", icon: "⚽", type: "text" },
                      ]
                    : []),
                ].map(({ name, label, icon, type }) => (
                  <div key={name}>
                    <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <span>{icon}</span> {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all bg-gray-50"
                      style={{ "--tw-ring-color": colors.accent }}
                      onFocus={(e) => (e.target.style.borderColor = colors.accent)}
                      onBlur={(e) => (e.target.style.borderColor = "")}
                    />
                  </div>
                ))}

                {/* Bio full width */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    📝 Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Write a short bio about yourself..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none resize-none bg-gray-50"
                    onFocus={(e) => (e.target.style.borderColor = colors.accent)}
                    onBlur={(e) => (e.target.style.borderColor = "")}
                  />
                </div>
              </div>

              {/* Role field — read only */}
              <div className="mt-4 flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3">
                <span>🎯</span>
                <div>
                  <p className="text-xs text-gray-400">Role (cannot be changed)</p>
                  <p className="text-sm font-semibold capitalize text-gray-700">{user?.role}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow transition-all hover:opacity-90 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}cc)` }}
                >
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  onClick={() => { setEditMode(false); setActiveTab("overview"); }}
                  className="px-6 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharedProfile;