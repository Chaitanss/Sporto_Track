import jwt from "jsonwebtoken";

// ✅ VERIFY TOKEN
export const protect = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No token ❌" });
    }

    // 🔥 Remove "Bearer "
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, role }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token ❌" });
  }
};

// ✅ ROLE BASED ACCESS
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied ❌" });
    }
    next();
  };
};

// ✅ ADD THIS LINE (FIX)
export default protect;