const { ROLES } = require('./roles');

/**
 * Granular permissions — the core of the RBAC system.
 * Instead of checking roles directly in controllers, we check permissions.
 * This decouples business logic from specific role names.
 *
 * Adding a new role? Just define its permission set here. Zero code changes elsewhere.
 */
const PERMISSIONS = Object.freeze({
  // Dashboard
  VIEW_DASHBOARD_SUMMARY: 'view_dashboard_summary',
  VIEW_DASHBOARD_ANALYTICS: 'view_dashboard_analytics',

  // Financial Records
  CREATE_RECORD: 'create_record',
  VIEW_RECORDS: 'view_records',
  UPDATE_RECORD: 'update_record',
  DELETE_RECORD: 'delete_record',

  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  MANAGE_ROLES: 'manage_roles',
});

/**
 * Role → Permission mapping.
 * Each role gets a specific set of permissions.
 * This is the single source of truth for access control.
 */
const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_DASHBOARD_SUMMARY,
  ],

  [ROLES.ANALYST]: [
    PERMISSIONS.VIEW_DASHBOARD_SUMMARY,
    PERMISSIONS.VIEW_DASHBOARD_ANALYTICS,
    PERMISSIONS.VIEW_RECORDS,
  ],

  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin gets everything
});

/**
 * Check if a role has a specific permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
};

module.exports = { PERMISSIONS, ROLE_PERMISSIONS, hasPermission };
