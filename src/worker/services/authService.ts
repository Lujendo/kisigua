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
          console.log('User isActive status:', dbUser.isActive, 'converted to:', isActive);

          user = {
            id: dbUser.id,
            email: dbUser.email,
            password: dbUser.password_hash,
            role: dbUser.role as UserRole,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            isActive: isActive,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
            lastLoginAt: dbUser.lastLoginAt
          };
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

      // Generate JWT token with longer expiration
      const payload: JWTPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      const token = await sign(payload, this.jwtSecret);

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
      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
      
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Create new user
      const userId = `user-${Date.now()}`;
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      
      const newUser: User = {
        id: userId,
        email: userData.email,
        password: hashedPassword,
        role: 'user', // Default role
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.users.set(userId, newUser);

      // Generate JWT token with longer expiration
      const payload: JWTPayload = {
        sub: newUser.id,
        email: newUser.email,
        role: newUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      const token = await sign(payload, this.jwtSecret);

      return {
        success: true,
        token,
        user: this.toUserProfile(newUser),
        message: 'Registration successful'
      };
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
    const user = this.users.get(userId);
    return user ? this.toUserProfile(user) : null;
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

  private toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
