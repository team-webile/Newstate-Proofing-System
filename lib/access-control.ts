// Access Control System
export interface User {
  id: string
  userId?: string
  email: string
  name?: string
  role: string
  createdAt?: string
  updatedAt?: string
}

export type UserRole = 'ADMIN' | 'Admin' | 'USER' | 'CLIENT'

export interface AccessRule {
  path: string
  allowedRoles: UserRole[]
  redirectTo?: string
  requireAuth: boolean
}

// Define access rules for different routes
export const ACCESS_RULES: AccessRule[] = [
  // Admin routes - only ADMIN can access
  {
    path: '/admin',
    allowedRoles: ['ADMIN', 'Admin'],
    redirectTo: '/unauthorized',
    requireAuth: true
  },
  {
    path: '/admin/dashboard',
    allowedRoles: ['ADMIN', 'Admin'],
    redirectTo: '/unauthorized',
    requireAuth: true
  },
  {
    path: '/admin/projects',
    allowedRoles: ['ADMIN', 'Admin'],
    redirectTo: '/unauthorized',
    requireAuth: true
  },
  {
    path: '/admin/settings',
    allowedRoles: ['ADMIN', 'Admin'],
    redirectTo: '/unauthorized',
    requireAuth: true
  },
  {
    path: '/admin/analytics',
    allowedRoles: ['ADMIN', 'Admin'],
    redirectTo: '/unauthorized',
    requireAuth: true
  },
  {
    path: '/admin/upload',
    allowedRoles: ['ADMIN', 'Admin'],
    redirectTo: '/unauthorized',
    requireAuth: true
  },

  // Client routes - no authentication required (public share links)
  {
    path: '/client',
    allowedRoles: ['ADMIN', 'USER', 'CLIENT'],
    requireAuth: false
  },

  // Auth routes - redirect if already authenticated
  {
    path: '/login',
    allowedRoles: ['ADMIN', 'USER', 'CLIENT'],
    redirectTo: '/admin/dashboard', // Will be overridden based on role
    requireAuth: false
  },
  {
    path: '/register',
    allowedRoles: ['ADMIN', 'USER', 'CLIENT'],
    redirectTo: '/admin/dashboard', // Will be overridden based on role
    requireAuth: false
  },

  // Public routes
  {
    path: '/',
    allowedRoles: ['ADMIN', 'USER', 'CLIENT'],
    requireAuth: false
  },
  {
    path: '/unauthorized',
    allowedRoles: ['ADMIN', 'USER', 'CLIENT'],
    requireAuth: false
  }
]

// Check if user has access to a specific path
export function hasAccess(user: User | null, path: string): boolean {
  const rule = findAccessRule(path)
  
  if (!rule) {
    // No specific rule, allow access
    return true
  }

  // If route requires auth but user is not authenticated
  if (rule.requireAuth && !user) {
    return false
  }

  // If user is authenticated, check role
  if (user) {
    return rule.allowedRoles.includes(user.role as UserRole)
  }

  // If route doesn't require auth, allow access
  return !rule.requireAuth
}

// Find the most specific access rule for a path
export function findAccessRule(path: string): AccessRule | null {
  // Sort rules by path length (most specific first)
  const sortedRules = [...ACCESS_RULES].sort((a, b) => b.path.length - a.path.length)
  
  for (const rule of sortedRules) {
    if (path.startsWith(rule.path)) {
      return rule
    }
  }
  
  return null
}

// Get redirect URL for unauthorized access
export function getRedirectUrl(user: User | null, path: string): string {
  const rule = findAccessRule(path)
  
  if (!rule) {
    return '/'
  }

  // If user is not authenticated and route requires auth
  if (rule.requireAuth && !user) {
    return '/login'
  }

  // If user is authenticated but doesn't have required role
  if (user && !rule.allowedRoles.includes(user.role as UserRole)) {
    return rule.redirectTo || '/unauthorized'
  }

  // If user is already authenticated and trying to access auth pages
  if (user && (path === '/login' || path === '/register')) {
    if (user.role === 'ADMIN') {
      return '/admin/dashboard'
    }
    return '/'
  }

  return '/'
}

// Check if user should be redirected from auth pages
export function shouldRedirectFromAuth(user: User | null): boolean {
  return user !== null
}

// Get appropriate dashboard URL based on user role
export function getDashboardUrl(user: User): string {
  switch (user.role) {
    case 'ADMIN':
    case 'Admin':
      return '/admin/dashboard'
    case 'USER':
      return '/client'
    case 'CLIENT':
      return '/client'
    default:
      return '/'
  }
}

// Check if user is admin
export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'Admin'
}

// Check if user is authenticated
export function isAuthenticated(user: User | null): boolean {
  return user !== null
}

// Get user role display name
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrator'
    case 'USER':
      return 'User'
    case 'CLIENT':
      return 'Client'
    default:
      return 'Unknown'
  }
}
