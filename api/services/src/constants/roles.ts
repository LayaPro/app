// Dynamic role hierarchy - defines which roles can access what
// This is more flexible than hardcoded role names
export const ROLE_HIERARCHY = {
  // System-wide permissions
  MANAGE_SYSTEM: ['superadmin'],
  MANAGE_TENANTS: ['superadmin'],
  
  // Tenant-level permissions  
  MANAGE_USERS: ['superadmin', 'admin'],
  MANAGE_ROLES: ['superadmin', 'admin'],
  
  // Tenant operations
  CREATE_TENANT: ['superadmin'],
  VIEW_TENANTS: ['superadmin'],
  UPDATE_TENANT: ['superadmin'],
  DELETE_TENANT: ['superadmin'],
  DEACTIVATE_TENANT: ['superadmin'],
  
  // Content permissions
  CREATE_CONTENT: ['superadmin', 'admin', 'photographer', 'editor'],
  EDIT_CONTENT: ['superadmin', 'admin', 'photographer', 'editor'],
  VIEW_CONTENT: ['superadmin', 'admin', 'photographer', 'editor', 'viewer'],
  
  // Basic access
  ACCESS_API: [], // Empty means any authenticated user
} as const;

export type Permission = keyof typeof ROLE_HIERARCHY;

// Cache for roles loaded from database
let rolesCache: Map<string, any> = new Map();
let rolesCacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to check if cache is valid
export const isCacheValid = (): boolean => {
  return Date.now() - rolesCacheTimestamp < CACHE_TTL;
};

// Clear the roles cache (useful when roles are updated)
export const clearRolesCache = (): void => {
  rolesCache.clear();
  rolesCacheTimestamp = 0;
};

// Load roles from database with caching
export const loadRolesFromDB = async (): Promise<Map<string, any>> => {
  if (isCacheValid() && rolesCache.size > 0) {
    return rolesCache;
  }

  try {
    const Role = (await import('../models/role')).default;
    const roles = await Role.find({}).lean();
    
    rolesCache.clear();
    roles.forEach(role => {
      rolesCache.set(role.name.toLowerCase(), role);
    });
    
    rolesCacheTimestamp = Date.now();
    return rolesCache;
  } catch (error) {
    console.error('Failed to load roles from database:', error);
    return rolesCache; // Return cached version if DB fails
  }
};

// Check if a role has a specific permission
export const hasPermission = async (roleName: string, permission: Permission): Promise<boolean> => {
  const allowedRoles = ROLE_HIERARCHY[permission];
  
  // If permission allows any role (empty array), just check if role exists
  if (allowedRoles.length === 0) {
    const roles = await loadRolesFromDB();
    return roles.has(roleName.toLowerCase());
  }
  
  // Check if role is in the allowed list
  return allowedRoles.includes(roleName.toLowerCase() as any);
};

// Get all roles that have a specific permission
export const getRolesWithPermission = (permission: Permission): readonly string[] => {
  return ROLE_HIERARCHY[permission] || [];
};

// Type for role names (for backwards compatibility)
export type RoleName = string;