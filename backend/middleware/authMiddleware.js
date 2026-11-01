const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Protect routes requiring authentication
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'foodbridge_award_winning_secret_key_2026'
      );

      const userResult = await db.query(
        'SELECT id, name, email, phone, address, city, role, avatar, is_verified, created_at FROM platform_users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists or session is invalid.',
        });
      }

      req.user = userResult.rows[0];
      return next();
    } catch (err) {
      console.error('[AuthMiddleware] Token verification error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please sign in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required in Bearer format.',
    });
  }
};

// Role-based access control (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization.',
      });
    }

    const normalizedUserRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = roles.map((r) => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};

