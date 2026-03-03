// backend/middleware/roleMiddleware.js
const role = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

// Export both the existing role middleware and a new requireRole function
export default role;

// Additional helper for specific role requirement
export const requireRole = (roleName) => {
  return (req, res, next) => {
    if (req.user.role !== roleName) {
      return res.status(403).json({ message: `Access denied: requires ${roleName} role` });
    }
    next();
  };
};