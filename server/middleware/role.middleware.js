const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

// Convenience role guards
const isAdmin                   = requireRole('management_admin');
const isAdminOrManager          = requireRole('management_admin', 'senior_manager');
const isAdminOrRecruiter        = requireRole('management_admin', 'hr_recruiter');
const isAdminManagerOrRecruiter = requireRole('management_admin', 'senior_manager', 'hr_recruiter');
const isStaff                   = requireRole('management_admin', 'senior_manager', 'hr_recruiter', 'employee');
const isAuthenticated           = requireRole('management_admin', 'senior_manager', 'hr_recruiter', 'employee', 'candidate');

module.exports = {
  requireRole,
  isAdmin,
  isAdminOrManager,
  isAdminOrRecruiter,
  isAdminManagerOrRecruiter,
  isStaff,
  isAuthenticated,
};
