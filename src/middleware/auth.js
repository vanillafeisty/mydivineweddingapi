import { verifyAccessToken } from "../utils/tokenManager.js";
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; 

    if (!token) {
      return res.status(401).json({ success: false, message: "Access token required" });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

/**
 * Restricted access based on numeric Role IDs.
 * @param  {...number} allowedRoles 
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User context not found" });
    }

    const userRole = Number(req.user.role);

    console.log("--- SECURITY CHECK ---");
    console.log("User ID:", req.user.userId || req.user.id);
    console.log("Role in Token:", userRole);
    console.log("Allowed Roles:", allowedRoles);

    if (!allowedRoles.includes(userRole)) {
      console.warn(`Blocked Access: User role ${userRole} attempted unauthorized route.`);
      return res.status(403).json({ 
        success: false, 
        message: "Insufficient permissions to access this data." 
      });
    }

    next();
  };
};

export const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || "Internal server error" 
  });
};