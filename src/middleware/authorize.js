const ApiError = require('../utils/ApiError');
const { hasPermission } = require('../constants/permissions');

/**
 * Authorization middleware factory.
 * Checks if the authenticated user's role has the required permission(s).
 *
 * This is permission-based, NOT role-based.
 * Controllers say "you need CREATE_RECORD permission" — not "you must be admin".
 * This decouples business logic from specific role names.
 *
 * Usage:
 *   router.post('/records', authenticate, authorize(PERMISSIONS.CREATE_RECORD), controller);
 *   router.get('/records', authenticate, authorize(PERMISSIONS.VIEW_RECORDS), controller);
 *
 * @param  {...string} requiredPermissions - One or more permissions (ANY match = authorized)
 */
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const userRole = req.user.role;

    // Check if user has ANY of the required permissions
    const hasAccess = requiredPermissions.some((perm) =>
      hasPermission(userRole, perm)
    );

    if (!hasAccess) {
      return next(
        ApiError.forbidden(
          `Insufficient permissions. Required: ${requiredPermissions.join(' or ')}. Your role: ${userRole}`
        )
      );
    }

    next();
  };
};

module.exports = authorize;
