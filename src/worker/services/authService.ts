import { sign, verify } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';
import {
  User,
  UserProfile,
  JWTPayload,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserRole
} from '../types/auth';
import { DatabaseService } from './databaseService';

export class AuthService {
  private jwtSecret: string;
  private databaseService: DatabaseService;
  private users: Map<string, User> = new Map(); // Fallback for test users

  constructor(jwtSecret: string, databaseService: DatabaseService) {
    this.jwtSecret = jwtSecret;
    this.databaseService = databaseService;
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    console.log('Initializing default users...');

    // Create default admin user
    const adminId = 'admin-001';
    const adminPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    const adminUser: User = {
      id: adminId,
      email: 'admin@kisigua.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(adminId, adminUser);
    console.log('Created admin user:', {
      email: adminUser.email,
      passwordLength: hashedPassword.length,
      isActive: adminUser.isActive
    });

    // Create default test users for each role
    const testUsers = [
      {
        id: 'user-001',
        email: 'user@test.com',
        role: 'user' as UserRole,
        firstName: 'Test',
        lastName: 'User',
      },
      {
        id: 'premium-001',
        email: 'premium@test.com',
        role: 'premium' as UserRole,
        firstName: 'Premium',
        lastName: 'User',
      },
      {
        id: 'supporter-001',
        email: 'supporter@test.com',
        role: 'supporter' as UserRole,
        firstName: 'Supporter',
        lastName: 'User',
      },
    ];

    testUsers.forEach(userData => {
      const hashedPassword = bcrypt.hashSync('test123', 10);
      const user: User = {
        ...userData,
        password: hashedPassword,
        emailVerified: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.set(userData.id, user);
      console.log('Created test user:', {
        email: user.email,
        role: user.role,
        passwordLength: hashedPassword.length,
        isActive: user.isActive
      });
    });

    console.log('Total in-memory users created:', this.users.size);
    console.log('Available test accounts:');
    console.log('- admin@kisigua.com / admin123 (admin)');
    console.log('- user@test.com / test123 (user)');
    console.log('- premium@test.com / test123 (premium)');
    console.log('- supporter@test.com / test123 (supporter)');
  }

  // Debug method to list all users
  listAllUsers() {
    console.log('=== ALL AVAILABLE USERS ===');
    console.log('In-memory users:', this.users.size);
    this.users.forEach((user) => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    console.log('===========================');
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Login attempt for:', credentials.email);
      this.listAllUsers(); // Debug: show all available users
      // First try to find user in database
      let user: User | null = null;

      try {
        const dbUser = await this.databaseService.getUserByEmail(credentials.email);
        console.log('Database user lookup result:', dbUser);
        if (dbUser) {
          // Convert SQLite boolean (0/1) to JavaScript boolean
          const isActive = Boolean(dbUser.isActive);
          const emailVerified = Boolean((dbUser as any).email_verified);

          console.log('🔍 Database user field conversion:', {
            email: dbUser.email,
            raw_is_active: dbUser.isActive,
            converted_isActive: isActive,
            raw_email_verified: (dbUser as any).email_verified,
            converted_emailVerified: emailVerified,
            email_verified_type: typeof (dbUser as any).email_verified
          });

          user = {
            id: dbUser.id,
            email: dbUser.email,
            password: dbUser.password_hash,
            role: dbUser.role as UserRole,
            firstName: (dbUser as any).first_name || dbUser.firstName || '',
            lastName: (dbUser as any).last_name || dbUser.lastName || '',
            emailVerified: emailVerified,
            isActive: isActive,
            createdAt: dbUser.createdAt || new Date().toISOString(),
            updatedAt: dbUser.updatedAt || new Date().toISOString(),
            lastLoginAt: dbUser.lastLoginAt
          };

          console.log('✅ User loaded from database:', {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            isActive: user.isActive
          });

          // Store user in memory for future requests
          this.users.set(user.id, user);
          console.log('✅ User stored in memory for future requests');
        }
      } catch (dbError) {
        console.warn('Database lookup failed, falling back to in-memory users:', dbError);
      }

      // Fallback to in-memory users (for test accounts)
      if (!user) {
        user = Array.from(this.users.values()).find(u => u.email === credentials.email) || null;
        console.log('Fallback to in-memory user:', user ? 'found' : 'not found');
      }

      if (!user) {
        console.log('No user found for email:', credentials.email);
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      console.log('User found:', { email: user.email, isActive: user.isActive, role: user.role });

      if (!user.isActive) {
        console.log('User account is deactivated:', user.email);
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Verify password
      console.log('Password verification:', {
        email: user.email,
        providedPassword: credentials.password,
        storedHash: user.password,
        hashLength: user.password?.length
      });

      const isPasswordValid = bcrypt.compareSync(credentials.password, user.password);
      console.log('Password verification result:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('Password verification failed for user:', user.email);
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Update last login in database if user came from database
      const now = new Date().toISOString();
      try {
        if (await this.databaseService.getUserByEmail(credentials.email)) {
          await this.databaseService.updateUser(user.id, {
            lastLoginAt: now,
            updatedAt: now
          });
        }
      } catch (dbError) {
        console.warn('Failed to update last login in database:', dbError);
      }

      // Update in-memory user as well
      user.lastLoginAt = now;
      user.updatedAt = now;

      // Check if email verification is required (exclude test users and admin)
      const isTestUser = this.isTestUser(user.email);
      const isAdmin = user.role === 'admin';
      const requiresEmailVerification = !user.emailVerified && !isTestUser && !isAdmin;

      console.log('🔍 Email verification check for user:', user.email, {
        emailVerified: user.emailVerified,
        emailVerifiedType: typeof user.emailVerified,
        isTestUser: isTestUser,
        isAdmin: isAdmin,
        requiresEmailVerification: requiresEmailVerification
      });

      if (requiresEmailVerification) {
        console.log('❌ Email verification required for user:', user.email);
        return {
          success: false,
          requiresEmailVerification: true,
          email: user.email,
          message: 'Please verify your email address before logging in. Check your inbox for a verification link.'
        };
      }

      // Generate JWT token with longer expiration
      const payload: JWTPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      const token = await sign(payload, this.jwtSecret);

      console.log('Login successful for user:', user.email, 'Test user:', isTestUser, 'Admin:', isAdmin);

      return {
        success: true,
        token,
        user: this.toUserProfile(user),
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists in database first
      try {
        const existingDbUser = await this.databaseService.getUserByEmail(userData.email);
        if (existingDbUser) {
          return {
            success: false,
            message: 'User with this email already exists'
          };
        }
      } catch (dbError) {
        console.log('Database check failed, checking in-memory users:', dbError);
      }

      // Also check in-memory users (fallback)
      const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Create new user
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = bcrypt.hashSync(userData.password, 10);

      const newUser: User = {
        id: userId,
        email: userData.email,
        password: hashedPassword,
        role: 'user', // Default role
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save user to database
      try {
        await this.databaseService.createUser({
          id: userId,
          email: userData.email,
          password_hash: hashedPassword,
          role: 'user',
          first_name: userData.firstName,
          last_name: userData.lastName
        });
        console.log('✅ User saved to database:', userId);
      } catch (dbError) {
        console.error('❌ Failed to save user to database:', dbError);
        // Still store in memory as fallback
        this.users.set(userId, newUser);
        console.log('✅ User saved to memory as fallback:', userId);
      }

      // Also store in memory for immediate access
      this.users.set(userId, newUser);

      // Check if this is a test user or admin (bypass email verification)
      const isTestUser = this.isTestUser(userData.email);
      const isAdmin = newUser.role === 'admin';

      if (isTestUser || isAdmin) {
        // For test users and admins, mark as verified and log them in immediately
        newUser.emailVerified = true;

        // Update in database if possible
        try {
          await (this.databaseService as any).db.prepare(`
            UPDATE users SET email_verified = true WHERE id = ?
          `).bind(userId).run();
          console.log('✅ Test user marked as verified in database');
        } catch (dbError) {
          console.log('⚠️ Could not update verification status in database:', dbError);
        }

        // Generate JWT token and log them in
        const payload: JWTPayload = {
          sub: newUser.id,
          email: newUser.email,
          role: newUser.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        };

        const token = await sign(payload, this.jwtSecret);

        console.log('✅ Test user registered and logged in automatically:', userData.email);

        return {
          success: true,
          token,
          user: this.toUserProfile(newUser),
          message: 'Registration successful - logged in automatically (test user)'
        };
      } else {
        // For regular users, require email verification
        console.log('📧 Regular user registered, email verification required:', userData.email);

        return {
          success: true,
          requiresEmailVerification: true,
          email: userData.email,
          message: 'Registration successful! Please check your email to verify your account before logging in.'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'An error occurred during registration'
      };
    }
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = await verify(token, this.jwtSecret) as unknown as JWTPayload;

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired:', { exp: payload.exp, current: currentTime });
        return null;
      }

      // Check if user still exists and is active
      const user = this.users.get(payload.sub);
      if (!user || !user.isActive) {
        console.log('User not found or inactive:', { userId: payload.sub, userExists: !!user, isActive: user?.isActive });
        return null;
      }

      console.log('Token verified successfully:', { userId: payload.sub, email: payload.email });
      return payload;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  async refreshToken(oldToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.verifyToken(oldToken);

      if (!payload) {
        return {
          success: false,
          message: 'Invalid or expired token'
        };
      }

      const user = this.users.get(payload.sub);
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Generate new JWT token
      const newPayload: JWTPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      const newToken = await sign(newPayload, this.jwtSecret);

      return {
        success: true,
        token: newToken,
        user: this.toUserProfile(user),
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    // First check in-memory users (test users)
    const memoryUser = this.users.get(userId);
    if (memoryUser) {
      return this.toUserProfile(memoryUser);
    }

    // Then check database users
    try {
      const dbUser = await this.databaseService.getUserById(userId);
      if (dbUser) {
        // Convert database user to User format and store in memory for future requests
        const user: User = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role as UserRole,
          password: dbUser.password_hash,
          isActive: Boolean(dbUser.isActive),
          emailVerified: Boolean(dbUser.emailVerified),
          createdAt: dbUser.createdAt,
          updatedAt: dbUser.updatedAt
        };

        // Store in memory for future requests
        this.users.set(userId, user);
        console.log('✅ Database user loaded by ID and stored in memory:', {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          isActive: user.isActive
        });

        return this.toUserProfile(user);
      }
    } catch (error) {
      console.error('❌ Error loading user by ID from database:', error);
    }

    return null;
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user ? this.toUserProfile(user) : null;
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.role = newRole;
    user.updatedAt = new Date().toISOString();
    return true;
  }

  async deactivateUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.isActive = false;
    user.updatedAt = new Date().toISOString();
    return true;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return Array.from(this.users.values()).map(user => this.toUserProfile(user));
  }

  /**
   * Check if a user is a test user (should bypass email verification)
   */
  private isTestUser(email: string): boolean {
    const testUserEmails = [
      'test@example.com',
      'user@example.com',
      'producer@example.com',
      'admin@example.com',
      'test1@example.com',
      'test2@example.com',
      'test3@example.com',
      'developer@kisigua.com',
      'dev@kisigua.com',
      'test@kisigua.com'
    ];

    // Check if email is in test user list or matches test patterns
    const isTestEmail = testUserEmails.includes(email.toLowerCase()) ||
                       email.toLowerCase().includes('test') ||
                       email.toLowerCase().includes('example.com') ||
                       email.toLowerCase().includes('dev');

    console.log('Checking if test user:', email, 'Result:', isTestEmail);
    return isTestEmail;
  }

  private toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
