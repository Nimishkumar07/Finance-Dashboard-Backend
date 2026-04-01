/**
 * Role hierarchy: Admin > Analyst > Viewer
 * Each role inherits permissions from roles below it in the hierarchy.
 */
const ROLES = Object.freeze({
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
});

/**
 * Role hierarchy level — used for comparing roles.
 * Higher number = more privileges.
 */
const ROLE_HIERARCHY = Object.freeze({
  [ROLES.VIEWER]: 1,
  [ROLES.ANALYST]: 2,
  [ROLES.ADMIN]: 3,
});

const ALL_ROLES = Object.values(ROLES);

module.exports = { ROLES, ROLE_HIERARCHY, ALL_ROLES };
