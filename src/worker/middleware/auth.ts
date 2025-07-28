import { Context, Next } from 'hono';
import { AuthService } from '../services/authService';
import { UserRole, ROLE_PERMISSIONS } from '../types/auth';

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
    services: any; // Services object
  }
}

export function createAuthMiddleware(authService: AuthService) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const payload = await authService.verifyToken(token);
      
      if (!payload) {
        return c.json({ error: 'Invalid or expired token' }, 401);
      }

      // Set auth context
      c.set('auth', {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      await next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return c.json({ error: 'Authentication failed' }, 401);
    }
  };
}

export function createRoleMiddleware(requiredRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth');
    
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (!requiredRoles.includes(auth.role)) {
      return c.json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: auth.role 
      }, 403);
    }

    await next();
  };
}

export function createPermissionMiddleware(permission: keyof typeof ROLE_PERMISSIONS.admin) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth');
    
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userPermissions = ROLE_PERMISSIONS[auth.role];
    
    if (!userPermissions[permission]) {
      return c.json({ 
        error: `Permission denied: ${permission}`,
        role: auth.role 
      }, 403);
    }

    await next();
  };
}

// Optional auth middleware - doesn't fail if no token provided
export function createOptionalAuthMiddleware(authService: AuthService) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = await authService.verifyToken(token);
        
        if (payload) {
          c.set('auth', {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
          });
        }
      } catch (error) {
        // Silently ignore auth errors for optional auth
        console.warn('Optional auth failed:', error);
      }
    }

    await next();
  };
}
