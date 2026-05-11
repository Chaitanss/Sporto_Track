import React from "react";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded shadow w-96 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">User Profile</h2>

        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Phone:</strong> {user?.phone}</p>
      </div>
    </div>
  );
}

export default Profile;