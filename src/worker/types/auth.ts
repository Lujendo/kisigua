export type UserRole = 'admin' | 'user' | 'premium' | 'supporter';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profileImageUrl?: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  [key: string]: any; // Index signature for Hono compatibility
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
  requiresEmailVerification?: boolean;
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  email: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  email: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  userId?: string;
  emailType: 'verification' | 'password_reset' | 'welcome' | 'notification';
  recipientEmail: string;
  subject: string;
  resendMessageId?: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  errorMessage?: string;
  sentAt: string;
  deliveredAt?: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface RolePermissions {
  canCreateListings: boolean;
  canEditOwnListings: boolean;
  canEditAllListings: boolean;
  canDeleteOwnListings: boolean;
  canDeleteAllListings: boolean;
  canAccessAdminDashboard: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  maxListingsPerMonth: number;
  canAccessPremiumFeatures: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateListings: true,
    canEditOwnListings: true,
    canEditAllListings: true,
    canDeleteOwnListings: true,
    canDeleteAllListings: true,
    canAccessAdminDashboard: true,
    canManageUsers: true,
    canViewAnalytics: true,
    maxListingsPerMonth: -1, // unlimited
    canAccessPremiumFeatures: true,
  },
  premium: {
    canCreateListings: true,
    canEditOwnListings: true,
    canEditAllListings: false,
    canDeleteOwnListings: true,
    canDeleteAllListings: false,
    canAccessAdminDashboard: false,
    canManageUsers: false,
    canViewAnalytics: false,
    maxListingsPerMonth: 50,
    canAccessPremiumFeatures: true,
  },
  supporter: {
    canCreateListings: true,
    canEditOwnListings: true,
    canEditAllListings: false,
    canDeleteOwnListings: true,
    canDeleteAllListings: false,
    canAccessAdminDashboard: false,
    canManageUsers: false,
    canViewAnalytics: false,
    maxListingsPerMonth: 20,
    canAccessPremiumFeatures: false,
  },
  user: {
    canCreateListings: true,
    canEditOwnListings: true,
    canEditAllListings: false,
    canDeleteOwnListings: true,
    canDeleteAllListings: false,
    canAccessAdminDashboard: false,
    canManageUsers: false,
    canViewAnalytics: false,
    maxListingsPerMonth: 5,
    canAccessPremiumFeatures: false,
  },
};
