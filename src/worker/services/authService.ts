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

export class AuthService {
  private jwtSecret: string;
  private users: Map<string, User> = new Map(); // In-memory storage for now

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    // Create default admin user
    const adminId = 'admin-001';
    const adminUser: User = {
      id: adminId,
      email: 'admin@kisigua.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(adminId, adminUser);

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
      const user: User = {
        ...userData,
        password: bcrypt.hashSync('test123', 10),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.set(userData.id, user);
    });
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = Array.from(this.users.values()).find(u => u.email === credentials.email);
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Verify password
      const isPasswordValid = bcrypt.compareSync(credentials.password, user.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Update last login
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();

      // Generate JWT token
      const payload: JWTPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
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

      // Generate JWT token
      const payload: JWTPayload = {
        sub: newUser.id,
        email: newUser.email,
        role: newUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
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
      
      // Check if user still exists and is active
      const user = this.users.get(payload.sub);
      if (!user || !user.isActive) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    const user = this.users.get(userId);
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
