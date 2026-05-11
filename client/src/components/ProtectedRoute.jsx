import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // ❌ Not logged in
  if (!token || !user) {
    return <Navigate to="/" />;
  }

  // ❌ Wrong role
  if (role && user.role !== role) {
    if (user.role === "coach") return <Navigate to="/coach" />;
    if (user.role === "player") return <Navigate to="/player" />;
    if (user.role === "analyst") return <Navigate to="/analyst" />;
  }

  return children;
};

export default ProtectedRoute;