import { Hono } from "hono";
import { cors } from "hono/cors";
import * as jwt from "jsonwebtoken";
import { AuthService } from "./services/authService";
import { ListingsService } from "./services/listingsService";
import { SubscriptionService } from "./services/subscriptionService";
import { DatabaseService } from "./services/databaseService";
import { StorageService } from "./services/storageService";
import { AnalyticsService } from "./services/analyticsService";
import { CategoryService } from "./services/categoryService";
import { FavoritesService } from "./services/favoritesService";
import { ActivityService } from "./services/activityService";
import { StatsService } from "./services/statsService";
import { DuplicateDetectionService } from "./services/duplicateDetectionService";
import { EmailVerificationService } from "./services/emailVerificationService";
import { EmbeddingService } from "./services/embeddingService";
import { SemanticSearchService } from "./services/semanticSearchService";
import { UserBehaviorService } from "./services/userBehaviorService";
import {
  createAuthMiddleware,
  createRoleMiddleware
} from "./middleware/auth";
import {
  LoginRequest,
  RegisterRequest,
  UserRole,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendVerificationRequest
} from "./types/auth";
import { SearchQuery, CreateListingRequest, UpdateListingRequest } from "./types/listings";
import { CreateCheckoutSessionRequest } from "./types/subscription";
import { Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();

// Initialize services (will be done per request to access bindings)
async function initializeServices(env: Env) {
  console.log('=== INITIALIZING SERVICES ===');
  const databaseService = new DatabaseService(env.DB);

  // Ensure email verification schema exists
  try {
    await databaseService.ensureEmailVerificationSchema();
    console.log('Email verification schema check completed');
  } catch (error) {
    console.error('Email verification schema check failed:', error);
  }

  const storageService = new StorageService(env.FILES, env.DB, env.R2_BUCKET_NAME, env.R2_PUBLIC_URL);
  const analyticsService = new AnalyticsService(env.ANALYTICS, env.DB);
  const categoryService = new CategoryService(env.DB);
  const favoritesService = new FavoritesService(env.DB);
  const activityService = new ActivityService(env.DB);
  const statsService = new StatsService(env.DB);

  console.log('Creating AuthService with JWT_SECRET:', env.JWT_SECRET ? 'SET' : 'USING FALLBACK');
  const authService = new AuthService(env.JWT_SECRET || 'your-secret-key-change-in-production', databaseService);
  console.log('AuthService created successfully');

  console.log('Creating EmailVerificationService with RESEND_API_KEY:', env.RESEND_API_KEY ? 'SET' : 'USING FALLBACK');
  const emailVerificationService = new EmailVerificationService(
    env.DB,
    env.RESEND_API_KEY || 're_F6JhDUHU_4eTP4noKar5kvSqmCUN13ZHA'
  );
  console.log('EmailVerificationService created successfully');

  const listingsService = new ListingsService(databaseService);
  const duplicateDetectionService = new DuplicateDetectionService(databaseService);
  const subscriptionService = new SubscriptionService(env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');

  console.log('Creating EmbeddingService with OPENAI_API_KEY:', env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
  const embeddingService = new EmbeddingService(env);
  console.log('EmbeddingService created successfully');

  console.log('Creating SemanticSearchService...');
  const semanticSearchService = new SemanticSearchService(env, databaseService);
  console.log('SemanticSearchService created successfully');

  console.log('Creating UserBehaviorService...');
  const userBehaviorService = new UserBehaviorService(databaseService);
  console.log('UserBehaviorService created successfully');

  // Initialize user behavior tables
  try {
    await semanticSearchService.initializeUserBehaviorTables();
    console.log('User behavior tables initialized');
  } catch (error) {
    console.error('Failed to initialize user behavior tables:', error);
  }

  console.log('=== SERVICES INITIALIZED ===');

  return {
    databaseService,
    storageService,
    analyticsService,
    categoryService,
    favoritesService,
    activityService,
    statsService,
    authService,
    emailVerificationService,
    listingsService,
    duplicateDetectionService,
    subscriptionService,
    embeddingService,
    semanticSearchService,
    userBehaviorService
  };
}

// Enable CORS for all routes
app.use("*", cors({
  origin: ['http://localhost:5173', 'http://localhost:8787', 'https://kisura.com', 'https://www.kisura.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware to initialize services and add to context
app.use("*", async (c, next) => {
  const services = await initializeServices(c.env);
  c.set('services', services);

  // Track page view for analytics
  if (c.req.method === 'GET' && !c.req.url.includes('/api/')) {
    const url = new URL(c.req.url);
    await services.analyticsService.trackPageView(
      url.pathname,
      c.req.raw,
      undefined, // userId will be set if authenticated
      c.req.header('x-session-id') || undefined
    );
  }

  await next();
});

// Helper middleware for authentication
const authMiddleware = async (c: any, next: any) => {
  const services = c.get('services');
  const middleware = createAuthMiddleware(services.authService);
  return await middleware(c, next);
};

// Helper middleware for role checking
const roleMiddleware = (roles: UserRole[]) => async (c: any, next: any) => {
  const middleware = createRoleMiddleware(roles);
  return await middleware(c, next);
};

// Basic API endpoint
app.get("/api/", (c) => c.json({
  name: "Kisigua API",
  version: "1.0.0",
  status: "active"
}));

// Health check endpoint
app.get("/api/health", (c) => {
  const services = c.get('services');
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    servicesInitialized: !!services,
    authServiceAvailable: !!services?.authService
  });
});

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', async (c) => {
  const width = parseInt(c.req.param('width')) || 300;
  const height = parseInt(c.req.param('height')) || 200;

  // Limit dimensions for security
  const maxWidth = Math.min(width, 1200);
  const maxHeight = Math.min(height, 800);

  // Create a simple SVG placeholder
  const svg = `<svg width="${maxWidth}" height="${maxHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
      ${maxWidth} × ${maxHeight}
    </text>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
});

// API info endpoint
app.get("/api/info", (c) => c.json({
  project: "Kisigua",
  description: "Connecting communities with local resources",
  features: [
    "Organic farms directory",
    "Local products marketplace",
    "Water sources locator",
    "Sustainable goods finder"
  ]
}));

// Authentication routes
app.post("/api/auth/login", async (c) => {
  try {
    const services = c.get('services');
    const body = await c.req.json() as LoginRequest;

    if (!body.email || !body.password) {
      return c.json({
        success: false,
        message: "Email and password are required"
      }, 400);
    }

    const result = await services.authService.login(body);

    // The AuthService now handles email verification logic internally,
    // including bypassing verification for test users and admins.
    // We should trust the AuthService result and not override it here.

    const statusCode = result.success ? 200 : (result.requiresEmailVerification ? 403 : 401);
    return c.json(result, statusCode);
  } catch (error) {
    console.error('Login endpoint error:', error);
    return c.json({
      success: false,
      message: "Invalid request format"
    }, 400);
  }
});

app.post("/api/auth/register", async (c) => {
  try {
    const services = c.get('services');
    const body = await c.req.json() as RegisterRequest;

    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return c.json({
        success: false,
        message: "All fields are required"
      }, 400);
    }

    const result = await services.authService.register(body);

    if (result.success) {
      // Only send verification email if the user requires email verification
      if (result.requiresEmailVerification && result.email) {
        console.log('📧 Sending verification email to:', result.email);

        // Create a temporary user object for email sending
        const tempUser = {
          id: 'temp-' + Date.now(),
          email: result.email,
          firstName: body.firstName,
          lastName: body.lastName,
          role: 'user' as const,
          password: '',
          isActive: true,
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const emailResult = await services.emailVerificationService.sendEmailVerification(tempUser);

        if (!emailResult.success) {
          console.error('❌ Failed to send verification email:', emailResult.error);
          // Don't fail registration if email fails, just log it
        } else {
          console.log('✅ Verification email sent successfully');
        }
      } else if (result.user && result.token) {
        console.log('✅ Test user or admin registered and logged in automatically');
      }
    }

    const statusCode = result.success ? 201 : 400;
    return c.json(result, statusCode);
  } catch (error) {
    console.error('Register endpoint error:', error);
    return c.json({
      success: false,
      message: "Invalid request format"
    }, 400);
  }
});

// Token verification endpoint
app.post("/api/auth/verify", async (c) => {
  try {
    const services = c.get('services');
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: "Missing or invalid authorization header"
      }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await services.authService.verifyToken(token);

    if (!payload) {
      return c.json({
        success: false,
        message: "Invalid or expired token"
      }, 401);
    }

    const user = await services.authService.getUserById(payload.sub);

    if (!user) {
      return c.json({
        success: false,
        message: "User not found"
      }, 404);
    }

    return c.json({
      success: true,
      user,
      token: token // Return the same token if it's valid
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({
      success: false,
      message: "Token verification failed"
    }, 401);
  }
});

// Email verification endpoints
app.post("/api/auth/verify-email", async (c) => {
  try {
    const services = c.get('services');
    const body = await c.req.json() as VerifyEmailRequest;

    if (!body.token) {
      return c.json({
        success: false,
        message: "Verification token is required"
      }, 400);
    }

    const result = await services.emailVerificationService.verifyEmail(body.token);

    if (!result.success) {
      return c.json({
        success: false,
        message: result.error || "Email verification failed"
      }, 400);
    }

    return c.json({
      success: true,
      message: "Email verified successfully",
      user: result.user
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return c.json({
      success: false,
      message: "Email verification failed"
    }, 500);
  }
});

app.post("/api/auth/forgot-password", async (c) => {
  try {
    const services = c.get('services');
    const body = await c.req.json() as ForgotPasswordRequest;

    if (!body.email) {
      return c.json({
        success: false,
        message: "Email is required"
      }, 400);
    }

    await services.emailVerificationService.sendPasswordReset(body.email);

    return c.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent"
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({
      success: false,
      message: "Failed to send password reset email"
    }, 500);
  }
});

app.post("/api/auth/reset-password", async (c) => {
  try {
    const services = c.get('services');
    const body = await c.req.json() as ResetPasswordRequest;

    if (!body.token || !body.newPassword) {
      return c.json({
        success: false,
        message: "Reset token and new password are required"
      }, 400);
    }

    if (body.newPassword.length < 8) {
      return c.json({
        success: false,
        message: "Password must be at least 8 characters long"
      }, 400);
    }

    const result = await services.emailVerificationService.resetPassword(body.token, body.newPassword);

    if (!result.success) {
      return c.json({
        success: false,
        message: result.error || "Password reset failed"
      }, 400);
    }

    return c.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({
      success: false,
      message: "Password reset failed"
    }, 500);
  }
});

app.post("/api/auth/resend-verification", async (c) => {
  try {
    const services = c.get('services');
    const body = await c.req.json() as ResendVerificationRequest;

    console.log('🔄 Resend verification request for:', body.email);

    if (!body.email) {
      return c.json({
        success: false,
        message: "Email is required"
      }, 400);
    }

    const result = await services.emailVerificationService.resendVerification(body.email);

    console.log('📧 Resend verification result:', {
      success: result.success,
      error: result.error,
      email: body.email
    });

    if (!result.success) {
      return c.json({
        success: false,
        message: result.error || "Failed to resend verification email"
      }, 400);
    }

    return c.json({
      success: true,
      message: "Verification email sent successfully"
    });
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    return c.json({
      success: false,
      message: "Failed to resend verification email"
    }, 500);
  }
});

// Token refresh endpoint
app.post("/api/auth/refresh", async (c) => {
  try {
    const services = c.get('services');
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: "Missing or invalid authorization header"
      }, 401);
    }

    const token = authHeader.substring(7);
    const result = await services.authService.refreshToken(token);

    const statusCode = result.success ? 200 : 401;
    return c.json(result, statusCode);
  } catch (error) {
    console.error('Token refresh endpoint error:', error);
    return c.json({
      success: false,
      message: "Token refresh failed"
    }, 401);
  }
});

// Debug endpoint to list all users (remove in production)
app.get("/api/debug/users", async (c) => {
  const services = c.get('services');
  services.authService.listAllUsers();

  // Also try to get the actual user data
  const testUser = await services.authService.getUserByEmail('user@test.com');
  const adminUser = await services.authService.getUserByEmail('admin@kisigua.com');

  return c.json({
    message: "User list logged to console. Check server logs.",
    availableAccounts: [
      "admin@kisigua.com / admin123 (admin)",
      "user@test.com / test123 (user)",
      "premium@test.com / test123 (premium)",
      "supporter@test.com / test123 (supporter)"
    ],
    userLookupTest: {
      testUser: testUser ? { email: testUser.email, role: testUser.role, isActive: testUser.isActive } : null,
      adminUser: adminUser ? { email: adminUser.email, role: adminUser.role, isActive: adminUser.isActive } : null
    }
  });
});

// Test login endpoint for debugging
app.post("/api/debug/test-login", async (c) => {
  const services = c.get('services');

  // Test with known credentials
  const testResult = await services.authService.login({
    email: 'user@test.com',
    password: 'test123'
  });

  const adminResult = await services.authService.login({
    email: 'admin@kisigua.com',
    password: 'admin123'
  });

  return c.json({
    testUserLogin: {
      success: testResult.success,
      message: testResult.message,
      hasUser: !!testResult.user
    },
    adminUserLogin: {
      success: adminResult.success,
      message: adminResult.message,
      hasUser: !!adminResult.user
    }
  });
});

// Test bcrypt functionality
app.get("/api/debug/bcrypt-test", async (c) => {
  try {
    const bcrypt = await import('bcryptjs');
    const testPassword = 'test123';
    const hash = bcrypt.hashSync(testPassword, 10);
    const isValid = bcrypt.compareSync(testPassword, hash);

    return c.json({
      bcryptWorking: true,
      testPassword,
      hashLength: hash.length,
      passwordVerification: isValid,
      hash: hash.substring(0, 20) + '...' // Show partial hash for security
    });
  } catch (error) {
    return c.json({
      bcryptWorking: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Protected route - get current user profile
app.get("/api/auth/me", authMiddleware, async (c) => {
  const services = c.get('services');
  const auth = c.get('auth');
  const user = await services.authService.getUserById(auth.userId);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});

// Admin only route - get all users
app.get("/api/admin/users", authMiddleware, roleMiddleware(['admin']), async (c) => {
  const services = c.get('services');
  const users = await services.authService.getAllUsers();
  return c.json({ users });
});

// Admin only route - update user role
app.put("/api/admin/users/:id/role", authMiddleware, roleMiddleware(['admin']), async (c) => {
  const services = c.get('services');
  const userId = c.req.param('id');
  const { role } = await c.req.json();

  const success = await services.authService.updateUserRole(userId, role);

  if (!success) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ success: true, message: "Role updated successfully" });
});

// Listings routes

// Public search endpoint
app.post("/api/listings/search", async (c) => {
  try {
    const services = c.get('services');
    const searchQuery = await c.req.json() as SearchQuery;
    const result = await services.listingsService.searchListings(searchQuery);
    return c.json(result);
  } catch (error) {
    console.error('Search endpoint error:', error);
    return c.json({ error: "Invalid search query" }, 400);
  }
});

// Semantic search endpoint
app.post("/api/listings/semantic-search", async (c) => {
  try {
    const services = c.get('services');
    const searchQuery = await c.req.json();

    // Get user ID if authenticated
    let userId = null;
    try {
      const auth = c.get('auth');
      userId = auth?.userId || null;
    } catch {
      // Not authenticated, continue without user ID
    }

    const result = await services.semanticSearchService.semanticSearch(searchQuery, userId);
    return c.json({
      results: result,
      count: result.length,
      searchType: 'semantic'
    });
  } catch (error) {
    console.error('Semantic search endpoint error:', error);
    return c.json({ error: "Semantic search failed" }, 500);
  }
});

// Hybrid search endpoint (combines semantic + keyword)
app.post("/api/listings/hybrid-search", async (c) => {
  try {
    const services = c.get('services');
    const searchQuery = await c.req.json();

    // Get user ID if authenticated
    let userId = null;
    try {
      const auth = c.get('auth');
      userId = auth?.userId || null;
    } catch {
      // Not authenticated, continue without user ID
    }

    const result = await services.semanticSearchService.hybridSearch(searchQuery, userId);
    return c.json(result);
  } catch (error) {
    console.error('Hybrid search endpoint error:', error);
    return c.json({ error: "Hybrid search failed" }, 500);
  }
});

// Find similar listings endpoint
app.get("/api/listings/:id/similar", async (c) => {
  try {
    const services = c.get('services');
    const listingId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '5');

    const result = await services.semanticSearchService.findSimilarListings(listingId, limit);
    return c.json({
      results: result,
      count: result.length,
      listingId
    });
  } catch (error) {
    console.error('Similar listings endpoint error:', error);
    return c.json({ error: "Failed to find similar listings" }, 500);
  }
});

// Personalized recommendations endpoint
app.get("/api/listings/recommendations", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const limit = parseInt(c.req.query('limit') || '10');

    const result = await services.semanticSearchService.getPersonalizedRecommendations(auth.userId, limit);
    return c.json({
      results: result,
      count: result.length,
      userId: auth.userId
    });
  } catch (error) {
    console.error('Recommendations endpoint error:', error);
    return c.json({ error: "Failed to get recommendations" }, 500);
  }
});

// Record user interaction endpoint
app.post("/api/listings/:id/interaction", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const listingId = c.req.param('id');
    const { interactionType, durationSeconds } = await c.req.json();

    // Validate interaction type
    const validTypes = ['view', 'favorite', 'unfavorite', 'contact', 'share'];
    if (!validTypes.includes(interactionType)) {
      return c.json({ error: "Invalid interaction type" }, 400);
    }

    await services.semanticSearchService.recordListingInteraction(
      auth.userId,
      listingId,
      interactionType,
      durationSeconds
    );

    return c.json({
      success: true,
      message: `${interactionType} interaction recorded`,
      listingId,
      userId: auth.userId
    });
  } catch (error) {
    console.error('Record interaction endpoint error:', error);
    return c.json({ error: "Failed to record interaction" }, 500);
  }
});

// Get user behavior analytics endpoint (admin only)
app.get("/api/admin/user-behavior/:userId", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const userId = c.req.param('userId');

    const preferences = await services.userBehaviorService.getUserPreferences(userId);
    const activitySummary = await services.userBehaviorService.getUserActivitySummary(userId);

    return c.json({
      userId,
      preferences,
      activitySummary
    });
  } catch (error) {
    console.error('User behavior analytics endpoint error:', error);
    return c.json({ error: "Failed to get user behavior analytics" }, 500);
  }
});

// Get trending search terms endpoint
app.get("/api/analytics/trending-searches", async (c) => {
  try {
    const services = c.get('services');
    const limit = parseInt(c.req.query('limit') || '10');

    const trendingTerms = await services.userBehaviorService.getTrendingSearchTerms(limit);

    return c.json({
      trendingSearches: trendingTerms,
      count: trendingTerms.length
    });
  } catch (error) {
    console.error('Trending searches endpoint error:', error);
    return c.json({ error: "Failed to get trending searches" }, 500);
  }
});

// Test email service endpoint (for debugging)
app.post("/api/test/email", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const { email, type = 'verification' } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    let result;
    if (type === 'verification') {
      const testUser = {
        id: 'test-user-' + Date.now(),
        email: email,
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as const,
        password: '',
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      result = await services.emailVerificationService.sendEmailVerification(testUser);
    } else {
      return c.json({ error: "Invalid email type" }, 400);
    }

    return c.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      message: result.success ? 'Test email sent successfully' : 'Test email failed',
      apiKeyStatus: c.env.RESEND_API_KEY ? (c.env.RESEND_API_KEY.startsWith('re_') ? 'VALID_FORMAT' : 'INVALID_FORMAT') : 'MISSING'
    });
  } catch (error) {
    console.error('Test email endpoint error:', error);
    return c.json({ error: "Failed to send test email" }, 500);
  }
});

// Simple Resend connection test endpoint
app.get("/api/test/resend-status", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const apiKey = c.env.RESEND_API_KEY;

    return c.json({
      hasApiKey: !!apiKey,
      apiKeyFormat: apiKey ? (apiKey.startsWith('re_') ? 'VALID' : 'INVALID') : 'MISSING',
      apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET',
      isPlaceholder: apiKey?.includes('PLACEHOLDER') || apiKey?.includes('development') || false,
      message: !apiKey ? 'No API key set' :
               !apiKey.startsWith('re_') ? 'Invalid API key format' :
               apiKey.includes('PLACEHOLDER') ? 'Using placeholder key - emails will be simulated' :
               'API key looks valid - ready to send emails'
    });
  } catch (error) {
    console.error('Resend status check error:', error);
    return c.json({ error: "Failed to check Resend status" }, 500);
  }
});

// Test Resend API connection with actual API call
app.post("/api/test/resend-connection", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');

    // Test the connection using the email service
    const connectionTest = await services.emailVerificationService.emailService.testConnection();

    return c.json({
      connectionTest,
      timestamp: new Date().toISOString(),
      message: connectionTest.success ?
        'Resend API connection is working! Check your Resend dashboard for the test email.' :
        'Resend API connection failed. Please check your API key.'
    });
  } catch (error) {
    console.error('Resend connection test error:', error);
    return c.json({
      success: false,
      error: "Failed to test Resend connection",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug endpoint to check if user exists in database
app.post("/api/test/check-user", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Check if user exists in database
    let dbUser = null;
    try {
      dbUser = await services.databaseService.getUserByEmail(email);
    } catch (dbError) {
      console.error('Database lookup error:', dbError);
    }

    // Check if user exists in memory (AuthService) - simplified check
    let memoryUserExists = false;
    let memoryUserInfo = null;

    try {
      // Access the users map from AuthService
      const users = (services.authService as any).users;
      if (users) {
        for (const [, user] of users.entries()) {
          if ((user as any).email === email) {
            memoryUserExists = true;
            memoryUserInfo = {
              id: (user as any).id,
              email: (user as any).email,
              role: (user as any).role,
              isActive: (user as any).isActive,
              emailVerified: (user as any).emailVerified
            };
            break;
          }
        }
      }
    } catch (memoryError) {
      console.error('Error checking memory users:', memoryError);
    }

    return c.json({
      email,
      existsInDatabase: !!dbUser,
      existsInMemory: memoryUserExists,
      databaseUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        isActive: dbUser.isActive,
        emailVerified: dbUser.email_verified
      } : null,
      memoryUser: memoryUserInfo,
      message: !dbUser && !memoryUserExists ? 'User not found in database or memory' :
               dbUser && memoryUserExists ? 'User exists in both database and memory' :
               dbUser ? 'User exists in database only' :
               'User exists in memory only'
    });
  } catch (error) {
    console.error('Check user endpoint error:', error);
    return c.json({ error: "Failed to check user" }, 500);
  }
});

// Embedding management endpoints (admin only)

// Generate embedding for a specific listing
app.post("/api/admin/embeddings/generate/:id", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const listingId = c.req.param('id');

    // Get listing from database
    const listing = await services.databaseService.getDatabase()
      .prepare('SELECT * FROM listings WHERE id = ? AND is_active = true')
      .bind(listingId)
      .first();

    if (!listing) {
      return c.json({ error: "Listing not found" }, 404);
    }

    // Generate and store embedding
    await services.embeddingService.processListingEmbedding(listing);

    return c.json({
      success: true,
      message: `Embedding generated for listing ${listingId}`,
      listingId
    });
  } catch (error) {
    console.error('Generate embedding endpoint error:', error);
    return c.json({ error: "Failed to generate embedding" }, 500);
  }
});

// Batch generate embeddings for all listings
app.post("/api/admin/embeddings/generate-all", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const batchSize = parseInt(c.req.query('batchSize') || '10');

    // Get all active listings
    const listings = await services.databaseService.getDatabase()
      .prepare('SELECT * FROM listings WHERE is_active = true ORDER BY created_at DESC')
      .all();

    if (!listings.results || listings.results.length === 0) {
      return c.json({ message: "No listings found" });
    }

    const allListings = listings.results;
    let processed = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < allListings.length; i += batchSize) {
      const batch = allListings.slice(i, i + batchSize);

      try {
        await services.embeddingService.processBatchListingEmbeddings(batch);
        processed += batch.length;
        console.log(`✅ Processed batch ${Math.floor(i/batchSize) + 1}, total processed: ${processed}`);
      } catch (error) {
        console.error(`❌ Error processing batch ${Math.floor(i/batchSize) + 1}:`, error);
        errors += batch.length;
      }

      // Small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return c.json({
      success: true,
      message: `Batch embedding generation completed`,
      totalListings: allListings.length,
      processed,
      errors,
      batchSize
    });
  } catch (error) {
    console.error('Batch generate embeddings endpoint error:', error);
    return c.json({ error: "Failed to generate batch embeddings" }, 500);
  }
});

// Get embedding statistics
app.get("/api/admin/embeddings/stats", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const stats = await services.embeddingService.getIndexStats();

    return c.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Embedding stats endpoint error:', error);
    return c.json({ error: "Failed to get embedding stats" }, 500);
  }
});

// Get single listing (public)
app.get("/api/listings/:id", async (c) => {
  try {
    const services = c.get('services');
    const listingId = c.req.param('id');

    // Determine user role for privacy settings
    let userRole = 'public';
    try {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, c.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;
        userRole = decoded.role || 'user';

        // Check if user owns this listing
        const dbListing = await services.databaseService.getListingById(listingId);
        if (dbListing && dbListing.user_id === decoded.sub) {
          userRole = 'owner';
        }
      }
    } catch (error) {
      // Not authenticated or invalid token - keep as 'public'
    }

    // First try to get from database with appropriate privacy settings
    const listing = await services.databaseService.getFullListingById(listingId, userRole);

    if (!listing) {
      // Fallback to in-memory service
      const fallbackListing = await services.listingsService.getListing(listingId);
      if (!fallbackListing) {
        return c.json({ error: "Listing not found" }, 404);
      }
      return c.json({ listing: fallbackListing });
    }

    // Increment view count
    await services.databaseService.incrementListingViews(listingId);

    return c.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    return c.json({ error: "Failed to retrieve listing" }, 500);
  }
});

// Create listing (authenticated)
app.post("/api/listings", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const data = await c.req.json() as CreateListingRequest;

    console.log('Creating listing with data:', data);

    // Check for potential duplicates
    const duplicates = await services.duplicateDetectionService.checkForDuplicates(data, auth.userId);

    // If high-confidence duplicates found, return warning
    const highConfidenceDuplicates = duplicates.filter((d: any) => d.confidence >= 80);
    if (highConfidenceDuplicates.length > 0) {
      return c.json({
        error: "Potential duplicate listing detected",
        duplicates: highConfidenceDuplicates.map((d: any) => ({
          id: d.listingId,
          title: d.title,
          address: d.address,
          reason: d.reason,
          confidence: d.confidence
        })),
        message: "A similar listing already exists. Please check if this is a duplicate before proceeding."
      }, 409); // 409 Conflict
    }

    // Prepare data for database service (needs id and user_id)
    const listingId = `listing-${Date.now()}`;

    // Transform frontend location format to database format
    const transformedLocation = {
      latitude: (data.location as any).coordinates?.lat || data.location.latitude || 0,
      longitude: (data.location as any).coordinates?.lng || data.location.longitude || 0,
      address: (data.location as any).street && (data.location as any).houseNumber
        ? `${(data.location as any).street} ${(data.location as any).houseNumber}`.trim()
        : data.location.address || '',
      street: (data.location as any).street || null,
      houseNumber: (data.location as any).houseNumber || null,
      city: data.location.city,
      region: data.location.region,
      country: data.location.country,
      postalCode: data.location.postalCode
    };

    // Add category-specific default images if none provided
    const getDefaultImagesForCategory = (category: string) => {
      const imagesByCategory: { [key: string]: string[] } = {
        'organic_farm': [
          'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'
        ],
        'local_product': [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'
        ],
        'water_source': [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop'
        ],
        'vending_machine': [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
        ],
        'craft': [
          'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop'
        ],
        'sustainable_good': [
          'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop'
        ]
      };

      return imagesByCategory[category] || imagesByCategory['local_product'];
    };

    const defaultImages = data.images && data.images.length > 0
      ? data.images
      : getDefaultImagesForCategory(data.category);

    const listingData = {
      ...data,
      id: listingId,
      user_id: auth.userId,
      location: transformedLocation,
      status: 'active', // Set new listings as active for immediate visibility
      images: defaultImages
    };

    console.log('Prepared listing data for database:', listingData);

    // Use database service to create and persist the listing
    const dbListing = await services.databaseService.createListing(listingData);
    console.log('Listing created in database:', dbListing);

    // Get the full listing with proper format
    const listing = await services.databaseService.getFullListingById(listingId);
    console.log('Retrieved full listing for API response:', listing);

    // Generate and store embedding for the new listing (async, don't wait)
    try {
      await services.embeddingService.processListingEmbedding(listing);
      console.log('✅ Embedding generated for new listing:', listingId);
    } catch (embeddingError) {
      console.error('⚠️ Failed to generate embedding for new listing:', embeddingError);
      // Don't fail the listing creation if embedding fails
    }

    return c.json({ listing }, 201);
  } catch (error) {
    console.error('Create listing error:', error);
    return c.json({ error: "Invalid listing data" }, 400);
  }
});

// Update listing (authenticated)
app.put("/api/listings/:id", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const listingId = c.req.param('id');
    const data = await c.req.json() as UpdateListingRequest;

    console.log('Updating listing:', listingId, 'with data:', data);

    // Check if listing exists and user has permission
    const existingListing = await services.databaseService.getFullListingById(listingId);
    if (!existingListing) {
      return c.json({ error: "Listing not found" }, 404);
    }

    const isAdmin = auth.role === 'admin';
    const isOwner = existingListing.userId === auth.userId;

    if (!isAdmin && !isOwner) {
      return c.json({ error: "Access denied" }, 403);
    }

    // Transform frontend location format to database format (same as create endpoint)
    let transformedData = { ...data };
    if (data.location) {
      transformedData.location = {
        latitude: (data.location as any).coordinates?.lat || data.location.latitude || 0,
        longitude: (data.location as any).coordinates?.lng || data.location.longitude || 0,
        address: (data.location as any).street && (data.location as any).houseNumber
          ? `${(data.location as any).street} ${(data.location as any).houseNumber}`.trim()
          : data.location.address || '',
        street: (data.location as any).street || null,
        houseNumber: (data.location as any).houseNumber || null,
        city: data.location.city,
        region: data.location.region,
        country: data.location.country,
        postalCode: data.location.postalCode
      };
    }



    console.log('Transformed update data:', transformedData);

    // Update the listing in database
    const updatedDbListing = await services.databaseService.updateListing(listingId, transformedData);
    if (!updatedDbListing) {
      return c.json({ error: "Failed to update listing" }, 500);
    }

    // Get the updated listing with proper format
    const listing = await services.databaseService.getFullListingById(listingId);
    console.log('Listing updated successfully:', listing);

    // Update embedding for the modified listing (async, don't wait)
    try {
      await services.embeddingService.processListingEmbedding(listing);
      console.log('✅ Embedding updated for listing:', listingId);
    } catch (embeddingError) {
      console.error('⚠️ Failed to update embedding for listing:', embeddingError);
      // Don't fail the listing update if embedding fails
    }

    return c.json({ listing });
  } catch (error) {
    console.error('Update listing error:', error);
    return c.json({ error: "Invalid listing data" }, 400);
  }
});

// Delete listing (authenticated)
app.delete("/api/listings/:id", authMiddleware, async (c) => {
  const services = c.get('services');
  const auth = c.get('auth');
  const listingId = c.req.param('id');

  const isAdmin = auth.role === 'admin';
  const success = await services.listingsService.deleteListing(listingId, auth.userId, isAdmin);

  if (!success) {
    return c.json({ error: "Listing not found or access denied" }, 404);
  }

  // Delete embedding for the deleted listing (async, don't wait)
  try {
    await services.embeddingService.deleteEmbedding(`listing_${listingId}`);
    console.log('✅ Embedding deleted for listing:', listingId);
  } catch (embeddingError) {
    console.error('⚠️ Failed to delete embedding for listing:', embeddingError);
    // Don't fail the listing deletion if embedding deletion fails
  }

  return c.json({ success: true });
});

// Get user's listings (authenticated)
app.get("/api/user/listings", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');

    // Get listings from database with images
    const listings = await services.databaseService.getUserListings(auth.userId);

    return c.json({ listings });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return c.json({ error: "Failed to fetch user listings" }, 500);
  }
});

// User settings endpoints
app.put("/api/user/profile", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const body = await c.req.json();

    const { firstName, lastName, email } = body;

    if (!firstName || !lastName || !email) {
      return c.json({
        success: false,
        message: "First name, last name, and email are required"
      }, 400);
    }

    // Update user profile
    const result = await services.databaseService.db.prepare(`
      UPDATE users
      SET first_name = ?, last_name = ?, email = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(firstName, lastName, email, auth.userId).run();

    if (result.success) {
      return c.json({
        success: true,
        message: "Profile updated successfully"
      });
    } else {
      return c.json({
        success: false,
        message: "Failed to update profile"
      }, 500);
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({
      success: false,
      message: "Failed to update profile"
    }, 500);
  }
});

app.post("/api/user/change-password", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const body = await c.req.json();

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json({
        success: false,
        message: "Current password and new password are required"
      }, 400);
    }

    // Verify current password
    const userResult = await services.databaseService.db.prepare(`
      SELECT password_hash FROM users WHERE id = ?
    `).bind(auth.userId).first();

    if (!userResult) {
      return c.json({
        success: false,
        message: "User not found"
      }, 404);
    }

    // Hash current password to compare
    const encoder = new TextEncoder();
    const currentPasswordData = encoder.encode(currentPassword);
    const currentPasswordHash = await crypto.subtle.digest('SHA-256', currentPasswordData);
    const currentPasswordHashArray = Array.from(new Uint8Array(currentPasswordHash));
    const currentPasswordHashString = currentPasswordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (currentPasswordHashString !== userResult.password_hash) {
      return c.json({
        success: false,
        message: "Current password is incorrect"
      }, 400);
    }

    // Hash new password
    const newPasswordData = encoder.encode(newPassword);
    const newPasswordHash = await crypto.subtle.digest('SHA-256', newPasswordData);
    const newPasswordHashArray = Array.from(new Uint8Array(newPasswordHash));
    const newPasswordHashString = newPasswordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update password
    const result = await services.databaseService.db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newPasswordHashString, auth.userId).run();

    if (result.success) {
      return c.json({
        success: true,
        message: "Password changed successfully"
      });
    } else {
      return c.json({
        success: false,
        message: "Failed to change password"
      }, 500);
    }
  } catch (error) {
    console.error('Password change error:', error);
    return c.json({
      success: false,
      message: "Failed to change password"
    }, 500);
  }
});

app.put("/api/user/notification-preferences", authMiddleware, async (c) => {
  try {
    // For now, just return success - in a real app, you'd store these preferences
    // You could add a user_preferences table to store notification settings

    return c.json({
      success: true,
      message: "Notification preferences updated successfully"
    });
  } catch (error) {
    console.error('Notification preferences update error:', error);
    return c.json({
      success: false,
      message: "Failed to update notification preferences"
    }, 500);
  }
});

app.get("/api/user/export-data", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');

    // Get user data
    const userData = await services.databaseService.db.prepare(`
      SELECT id, email, first_name, last_name, role, email_verified, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).bind(auth.userId).first();

    // Get user's listings
    const userListings = await services.databaseService.db.prepare(`
      SELECT * FROM listings WHERE user_id = ?
    `).bind(auth.userId).all();

    // Get user's favorites
    const userFavorites = await services.databaseService.db.prepare(`
      SELECT * FROM favorites WHERE user_id = ?
    `).bind(auth.userId).all();

    const exportData = {
      user: userData,
      listings: userListings.results || [],
      favorites: userFavorites.results || [],
      exportDate: new Date().toISOString()
    };

    return c.json(exportData, 200, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="kisigua-data-export-${new Date().toISOString().split('T')[0]}.json"`
    });
  } catch (error) {
    console.error('Data export error:', error);
    return c.json({
      success: false,
      message: "Failed to export data"
    }, 500);
  }
});

app.delete("/api/user/delete-account", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');

    // Delete user's data (cascading deletes should handle related records)
    const result = await services.databaseService.db.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(auth.userId).run();

    if (result.success) {
      return c.json({
        success: true,
        message: "Account deleted successfully"
      });
    } else {
      return c.json({
        success: false,
        message: "Failed to delete account"
      }, 500);
    }
  } catch (error) {
    console.error('Account deletion error:', error);
    return c.json({
      success: false,
      message: "Failed to delete account"
    }, 500);
  }
});

// Admin: Get all listings (including all statuses)
app.get("/api/admin/listings", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    console.log('Admin requesting all listings...');

    // Use the admin-specific method that doesn't filter by status
    const listings = await services.databaseService.getAllListingsForAdmin();
    console.log(`Admin endpoint returning ${listings.length} listings`);

    return c.json({ listings });
  } catch (error) {
    console.error('Admin get listings error:', error);
    return c.json({ error: "Failed to fetch listings" }, 500);
  }
});

// Admin: Get all users
app.get("/api/admin/users", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const users = await services.databaseService.getAllUsers();
    return c.json({ users });
  } catch (error) {
    console.error('Admin get users error:', error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Check for duplicates without creating (authenticated)
app.post("/api/listings/check-duplicates", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const data = await c.req.json() as CreateListingRequest;

    const duplicates = await services.duplicateDetectionService.checkForDuplicates(data, auth.userId);

    return c.json({
      duplicates: duplicates.map((d: any) => ({
        id: d.listingId,
        title: d.title,
        address: d.address,
        reason: d.reason,
        confidence: d.confidence,
        matchType: d.matchType
      }))
    });
  } catch (error) {
    console.error('Check duplicates error:', error);
    return c.json({ error: "Failed to check for duplicates" }, 500);
  }
});

// Admin: Force create listing (bypass duplicate detection)
app.post("/api/admin/listings/force-create", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const data = await c.req.json() as CreateListingRequest & { originalUserId?: string };

    console.log('Admin force creating listing with data:', data);

    // Use original user ID if provided, otherwise use admin's ID
    const userId = data.originalUserId || auth.userId;

    // Prepare data for database service (needs id and user_id)
    const listingId = `listing-${Date.now()}`;

    // Transform frontend location format to database format
    const transformedLocation = {
      latitude: (data.location as any).coordinates?.lat || data.location.latitude || 0,
      longitude: (data.location as any).coordinates?.lng || data.location.longitude || 0,
      address: (data.location as any).street && (data.location as any).houseNumber
        ? `${(data.location as any).street} ${(data.location as any).houseNumber}`.trim()
        : data.location.address || '',
      street: (data.location as any).street || null,
      houseNumber: (data.location as any).houseNumber || null,
      city: data.location.city,
      region: data.location.region,
      country: data.location.country,
      postalCode: data.location.postalCode
    };

    const listingData = {
      ...data,
      id: listingId,
      user_id: userId,
      location: transformedLocation,
      status: 'active' // Set new listings as active for immediate visibility
    };

    console.log('Prepared listing data for database (admin force create):', listingData);

    // Use database service to create and persist the listing (bypass duplicate detection)
    const dbListing = await services.databaseService.createListing(listingData);
    console.log('Listing force created by admin:', dbListing);

    // Get the full listing with proper format
    const listing = await services.databaseService.getFullListingById(listingId);
    console.log('Retrieved full listing for API response:', listing);

    return c.json({ listing }, 201);
  } catch (error) {
    console.error('Admin force create listing error:', error);
    return c.json({ error: "Invalid listing data" }, 400);
  }
});

// ===== CATEGORY ENDPOINTS =====

// Get all categories (public)
app.get("/api/categories", async (c) => {
  try {
    const services = c.get('services');
    const categories = await services.categoryService.getAllCategories(false);
    return c.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

// Get category by slug (public)
app.get("/api/categories/:slug", async (c) => {
  try {
    const services = c.get('services');
    const slug = c.req.param('slug');
    const category = await services.categoryService.getCategoryBySlug(slug);

    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }

    return c.json({ category });
  } catch (error) {
    console.error('Category fetch error:', error);
    return c.json({ error: "Failed to fetch category" }, 500);
  }
});

// Admin: Get all categories (including inactive)
app.get("/api/admin/categories", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const categories = await services.categoryService.getAllCategories(true);
    return c.json({ categories });
  } catch (error) {
    console.error('Admin categories fetch error:', error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

// Admin: Create category
app.post("/api/admin/categories", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const data = await c.req.json();

    if (!data.name) {
      return c.json({ error: "Category name is required" }, 400);
    }

    const category = await services.categoryService.createCategory(data, auth.userId);
    return c.json({ category }, 201);
  } catch (error) {
    console.error('Category creation error:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return c.json({ error: error.message }, 409);
    }
    return c.json({ error: "Failed to create category" }, 500);
  }
});

// Admin: Update category
app.put("/api/admin/categories/:id", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const id = c.req.param('id');
    const data = await c.req.json();

    const category = await services.categoryService.updateCategory(id, data);
    return c.json({ category });
  } catch (error) {
    console.error('Category update error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      return c.json({ error: error.message }, 409);
    }
    return c.json({ error: "Failed to update category" }, 500);
  }
});

// Admin: Delete category
app.delete("/api/admin/categories/:id", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const id = c.req.param('id');

    const success = await services.categoryService.deleteCategory(id);
    if (!success) {
      return c.json({ error: "Category not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Category deletion error:', error);
    if (error instanceof Error && error.message.includes('being used')) {
      return c.json({ error: error.message }, 409);
    }
    return c.json({ error: "Failed to delete category" }, 500);
  }
});

// Admin: Reorder categories
app.post("/api/admin/categories/reorder", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const { categoryIds } = await c.req.json();

    if (!Array.isArray(categoryIds)) {
      return c.json({ error: "categoryIds must be an array" }, 400);
    }

    const success = await services.categoryService.reorderCategories(categoryIds);
    return c.json({ success });
  } catch (error) {
    console.error('Category reorder error:', error);
    return c.json({ error: "Failed to reorder categories" }, 500);
  }
});

// Subscription routes

// Get all available plans (public)
app.get("/api/subscriptions/plans", async (c) => {
  const services = c.get('services');
  const plans = await services.subscriptionService.getAllPlans();
  return c.json({ plans });
});

// Get user's current subscription (authenticated)
app.get("/api/subscriptions/current", authMiddleware, async (c) => {
  const services = c.get('services');
  const auth = c.get('auth');
  const subscription = await services.subscriptionService.getUserSubscription(auth.userId);
  const plan = services.subscriptionService.getUserPlan(auth.userId);

  return c.json({
    subscription,
    plan
  });
});

// Create checkout session (authenticated)
app.post("/api/subscriptions/checkout", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const data = await c.req.json() as CreateCheckoutSessionRequest;

    const session = await services.subscriptionService.createCheckoutSession(auth.userId, data);
    return c.json(session);
  } catch (error) {
    console.error('Checkout session error:', error);
    return c.json({ error: "Failed to create checkout session" }, 400);
  }
});

// Cancel subscription (authenticated)
app.post("/api/subscriptions/cancel", authMiddleware, async (c) => {
  const services = c.get('services');
  const auth = c.get('auth');
  const { cancelAtPeriodEnd = true } = await c.req.json();

  const subscription = await services.subscriptionService.cancelSubscription(auth.userId, cancelAtPeriodEnd);

  if (!subscription) {
    return c.json({ error: "No active subscription found" }, 404);
  }

  return c.json({ subscription });
});

// Reactivate subscription (authenticated)
app.post("/api/subscriptions/reactivate", authMiddleware, async (c) => {
  const services = c.get('services');
  const auth = c.get('auth');

  const subscription = await services.subscriptionService.reactivateSubscription(auth.userId);

  if (!subscription) {
    return c.json({ error: "No subscription found" }, 404);
  }

  return c.json({ subscription });
});

// Admin: Get subscription statistics
app.get("/api/admin/subscriptions/stats", authMiddleware, roleMiddleware(['admin']), async (c) => {
  const services = c.get('services');
  const stats = await services.subscriptionService.getSubscriptionStats();
  return c.json({ stats });
});

// Stripe webhook endpoint (public, but should be secured with webhook signature verification)
app.post("/api/webhooks/stripe", async (c) => {
  try {
    const services = c.get('services');
    const event = await c.req.json();

    // In a real implementation, you would verify the webhook signature here
    // const sig = c.req.header('stripe-signature');
    // const endpointSecret = 'whsec_...';
    // const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

    await services.subscriptionService.handleWebhook(event);

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: "Webhook processing failed" }, 400);
  }
});

// File upload routes

// Generate signed upload URL
app.post("/api/upload/signed-url", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const { fileName, fileType, fileSize } = await c.req.json();

    const signedUrl = await services.storageService.generateSignedUploadUrl(
      auth.userId,
      fileName,
      fileType,
      fileSize
    );

    return c.json(signedUrl);
  } catch (error) {
    console.error('Signed URL error:', error);
    return c.json({ error: "Failed to generate upload URL" }, 400);
  }
});

// Handle file upload
app.post("/api/upload/:fileId", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const fileId = c.req.param('fileId');

    let fileData: ArrayBuffer;
    let fileName: string;
    let contentType: string;

    // Handle both form data and direct binary uploads
    const requestContentType = c.req.header('content-type') || '';

    if (requestContentType.includes('multipart/form-data')) {
      // Handle form data upload
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      fileData = await file.arrayBuffer();
      fileName = file.name;
      contentType = file.type || 'application/octet-stream';
    } else {
      // Handle direct binary upload
      fileData = await c.req.arrayBuffer();
      fileName = c.req.header('x-file-name') || 'unknown';
      contentType = requestContentType || 'application/octet-stream';
    }

    const r2Key = `uploads/${auth.userId}/${fileId}`;

    // Track upload start
    await services.storageService.trackFileUpload(
      fileId,
      auth.userId,
      fileName,
      fileData.byteLength,
      contentType,
      r2Key,
      'kisigua-files',
      'pending'
    );

    const result = await services.storageService.uploadFile(
      r2Key,
      fileData,
      contentType,
      {
        userId: auth.userId,
        originalFileName: fileName
      }
    );

    if (result.success) {
      // Update status to completed
      await services.storageService.updateFileUploadStatus(fileId, 'completed');
      return c.json({ success: true, url: result.url, fileId, r2Key });
    } else {
      // Update status to failed
      await services.storageService.updateFileUploadStatus(fileId, 'failed');
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: "Upload failed" }, 400);
  }
});

// Upload profile image
app.post("/api/upload/profile-image", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const contentType = c.req.header('content-type') || 'application/octet-stream';

    const imageData = await c.req.arrayBuffer();
    const originalFileName = c.req.header('x-file-name') || 'profile-image';

    const result = await services.storageService.uploadProfileImage(
      auth.userId,
      imageData,
      contentType,
      originalFileName
    );

    if (result.success) {
      // Update user profile with new image URL
      // This would typically update the database
      return c.json({
        success: true,
        imageUrl: result.url,
        fileId: result.fileId
      });
    } else {
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    console.error('Profile image upload error:', error);
    return c.json({ error: "Profile image upload failed" }, 400);
  }
});

// Upload listing image
app.post("/api/upload/listing-image/:listingId", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const listingId = c.req.param('listingId');
    const contentType = c.req.header('content-type') || 'application/octet-stream';

    const imageData = await c.req.arrayBuffer();
    const originalFileName = c.req.header('x-file-name') || 'listing-image';
    const altText = c.req.header('x-alt-text') || '';

    const result = await services.storageService.uploadListingImage(
      auth.userId,
      listingId,
      imageData,
      contentType,
      originalFileName,
      altText
    );

    if (result.success) {
      return c.json({
        success: true,
        imageUrl: result.url,
        fileId: result.fileId
      });
    } else {
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    console.error('Listing image upload error:', error);
    return c.json({ error: "Listing image upload failed" }, 400);
  }
});

// Generate signed URL for document upload
app.post("/api/upload/document/signed-url", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const { fileName, fileType, fileSize, documentType } = await c.req.json();

    const signedUrl = await services.storageService.generateSignedUploadUrl(
      auth.userId,
      fileName,
      fileType,
      fileSize
    );

    return c.json({
      ...signedUrl,
      documentType
    });
  } catch (error) {
    console.error('Document signed URL error:', error);
    return c.json({ error: "Failed to generate document upload URL" }, 400);
  }
});

// Upload document
app.post("/api/upload/document", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const contentType = c.req.header('content-type') || 'application/octet-stream';
    const documentType = c.req.header('x-document-type') as 'certification' | 'license' | 'other' || 'other';

    const documentData = await c.req.arrayBuffer();
    const originalFileName = c.req.header('x-file-name') || 'document';

    const result = await services.storageService.uploadDocument(
      auth.userId,
      documentData,
      contentType,
      originalFileName,
      documentType
    );

    if (result.success) {
      return c.json({
        success: true,
        documentUrl: result.url,
        fileId: result.fileId
      });
    } else {
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    console.error('Document upload error:', error);
    return c.json({ error: "Document upload failed" }, 400);
  }
});

// Serve files from R2
app.get("/files/*", async (c) => {
  try {
    const services = c.get('services');
    const path = c.req.param('*');

    const file = await services.storageService.getFile(path);
    if (!file) {
      return c.notFound();
    }

    const headers = new Headers();
    headers.set('Content-Type', file.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    return new Response(file.body, { headers });
  } catch (error) {
    console.error('File serve error:', error);
    return c.notFound();
  }
});

// Delete file
app.delete("/api/files/:fileId", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const fileId = c.req.param('fileId');

    // Get file info from database to verify ownership and get R2 key
    const stmt = services.storageService.db.prepare(`
      SELECT r2_key, user_id FROM file_uploads WHERE id = ? AND user_id = ?
    `);
    const result = await stmt.bind(fileId, auth.userId).first();

    if (!result) {
      return c.json({ error: "File not found or access denied" }, 404);
    }

    // Delete from R2
    const success = await services.storageService.deleteFile(result.r2_key);

    if (success) {
      // Delete from database
      const deleteStmt = services.storageService.db.prepare(`
        DELETE FROM file_uploads WHERE id = ? AND user_id = ?
      `);
      await deleteStmt.bind(fileId, auth.userId).run();

      return c.json({ success: true });
    } else {
      return c.json({ error: "Failed to delete file" }, 400);
    }
  } catch (error) {
    console.error('File delete error:', error);
    return c.json({ error: "File deletion failed" }, 500);
  }
});

// Get user's storage usage
app.get("/api/user/storage-usage", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');

    const usage = await services.storageService.getUserStorageUsage(auth.userId);

    return c.json({ usage });
  } catch (error) {
    console.error('Storage usage error:', error);
    return c.json({ error: "Failed to get storage usage" }, 500);
  }
});

// Update user profile image
app.put("/api/user/profile-image", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const { imageUrl } = await c.req.json();

    // Update user profile in database
    const updatedUser = await services.databaseService.updateUser(auth.userId, {
      profile_image_url: imageUrl
    });

    if (updatedUser) {
      return c.json({
        success: true,
        user: {
          ...updatedUser,
          profileImageUrl: updatedUser.profile_image_url
        }
      });
    } else {
      return c.json({ error: "Failed to update profile" }, 400);
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({ error: "Profile update failed" }, 500);
  }
});

// Get user's files
app.get("/api/user/files", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const { type } = c.req.query(); // 'images', 'documents', 'all'

    // Get files from database instead of just R2 listing
    const files = await services.storageService.getUserFiles(auth.userId, type);

    return c.json({ files });
  } catch (error) {
    console.error('Files list error:', error);
    return c.json({ error: "Failed to get files" }, 500);
  }
});

// Health check endpoint
app.get("/health", async (c) => {
  try {
    const services = c.get('services');
    const startTime = Date.now();

    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: c.env.ENVIRONMENT || 'unknown',
      checks: {
        database: 'unknown',
        storage: 'unknown',
        analytics: 'unknown'
      },
      responseTime: 0
    };

    // Test database connection
    try {
      await services.databaseService.getAllUsers();
      health.checks.database = 'healthy';
    } catch (error) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Test R2 storage
    try {
      await services.storageService.listFiles('health-check/', 1);
      health.checks.storage = 'healthy';
    } catch (error) {
      health.checks.storage = 'unhealthy';
      health.status = 'degraded';
    }

    // Test analytics
    try {
      if (services.analyticsService) {
        health.checks.analytics = 'healthy';
      }
    } catch (error) {
      health.checks.analytics = 'unhealthy';
    }

    health.responseTime = Date.now() - startTime;

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return c.json(health, statusCode);
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, 503);
  }
});

// Admin endpoint to populate sample images for existing listings
app.post("/api/admin/populate-sample-images", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');

    // Check if user is admin
    if (auth.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    // Sample images for different categories (API returns categories without cat_ prefix)
    const sampleImages = {
      organic_farm: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&q=80'
      ],
      local_product: [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800&h=600&fit=crop&q=80'
      ],
      water_source: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&q=80'
      ],
      vending_machine: [
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop&q=80'
      ],
      craft: [
        'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&q=80'
      ],
      sustainable_good: [
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=600&fit=crop&q=80'
      ]
    };

    // Get all listings
    const searchResult = await services.databaseService.searchListings({
      query: '',
      filters: {},
      page: 1,
      limit: 100
    });

    const listings = searchResult.listings;
    let updatedCount = 0;

    for (const listing of listings) {
      // Check if listing already has images
      const existingImages = await services.databaseService.getListingImages(listing.id);
      console.log(`Listing ${listing.id} (${listing.title}) has ${existingImages.length} existing images`);

      // For now, let's force update to ensure we have sample images
      // if (existingImages.length > 0) {
      //   continue; // Skip if already has images
      // }

      // Get sample images for this category
      const categoryImages = sampleImages[listing.category as keyof typeof sampleImages] || sampleImages.sustainable_good;
      const imagesToAdd = categoryImages.slice(0, 2); // Add 2 images per listing

      // Add images to the listing_images table
      for (let i = 0; i < imagesToAdd.length; i++) {
        const imageUrl = imagesToAdd[i];
        const imageId = `img_${listing.id}_${i + 1}_${Date.now()}`;

        await services.databaseService.db.prepare(`
          INSERT INTO listing_images (id, listing_id, image_url, image_key, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `).bind(imageId, listing.id, imageUrl, `sample/${imageId}.jpg`, i).run();
      }

      updatedCount++;
    }

    return c.json({
      success: true,
      message: `Added sample images to ${updatedCount} listings`,
      totalListings: listings.length,
      updatedListings: updatedCount
    });

  } catch (error) {
    console.error('Error populating sample images:', error);
    return c.json({ error: "Failed to populate sample images" }, 500);
  }
});

// Update listing cover image
app.put("/api/listings/:id/cover", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const listingId = c.req.param('id');
    const { coverImageIndex } = await c.req.json();

    // Get the listing to check ownership
    const listing = await services.databaseService.getFullListingById(listingId);
    if (!listing) {
      return c.json({ error: "Listing not found" }, 404);
    }

    // Check if user owns the listing or is admin
    if (listing.userId !== auth.userId && auth.role !== 'admin') {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Validate the cover image index
    if (typeof coverImageIndex !== 'number' || coverImageIndex < 0 || coverImageIndex >= listing.images.length) {
      return c.json({ error: "Invalid cover image index" }, 400);
    }

    // Get all listing images from database
    const images = await services.databaseService.getListingImages(listingId);
    if (images.length === 0) {
      return c.json({ error: "No images found for this listing" }, 400);
    }

    // Update sort_order to make the selected image the cover (sort_order = 0)
    // First, increment all sort_orders
    await services.databaseService.db.prepare(`
      UPDATE listing_images
      SET sort_order = sort_order + 1
      WHERE listing_id = ?
    `).bind(listingId).run();

    // Then set the selected image to sort_order = 0
    const selectedImageUrl = listing.images[coverImageIndex];
    await services.databaseService.db.prepare(`
      UPDATE listing_images
      SET sort_order = 0
      WHERE listing_id = ? AND image_url = ?
    `).bind(listingId, selectedImageUrl).run();

    return c.json({
      success: true,
      message: "Cover image updated successfully",
      coverImage: selectedImageUrl
    });

  } catch (error) {
    console.error('Error updating cover image:', error);
    return c.json({ error: "Failed to update cover image" }, 500);
  }
});

// Debug endpoint to check admin user (remove in production)
app.get("/debug/admin", async (c) => {
  const services = c.get('services');

  try {
    const adminUser = await services.databaseService.getUserByEmail('admin@kisigua.com');
    return c.json({
      found: !!adminUser,
      user: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        isActive: adminUser.isActive,
        isActiveType: typeof adminUser.isActive,
        createdAt: adminUser.createdAt
      } : null
    });
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Analytics routes

// Get analytics stats (admin only)
app.get("/api/admin/analytics", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const { startDate, endDate } = c.req.query();

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await services.analyticsService.getAnalyticsStats(start, end);
    return c.json({ stats });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// Get real-time stats (admin only)
app.get("/api/admin/analytics/realtime", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const stats = await services.analyticsService.getRealTimeStats();
    return c.json({ stats });
  } catch (error) {
    console.error('Real-time analytics error:', error);
    return c.json({ error: "Failed to fetch real-time stats" }, 500);
  }
});

// Fix database user passwords (temporary endpoint)
app.post("/api/debug/fix-passwords", async (c) => {
  try {
    const services = c.get('services');
    const bcrypt = await import('bcryptjs');

    // Update database users with correct passwords
    const users = [
      { email: 'user@test.com', password: 'test123' },
      { email: 'premium@test.com', password: 'test123' },
      { email: 'supporter@test.com', password: 'test123' },
      { email: 'admin@kisigua.com', password: 'admin123' }
    ];

    const results = [];

    for (const userData of users) {
      try {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        const dbUser = await services.databaseService.getUserByEmail(userData.email);

        if (dbUser) {
          // Direct database update instead of using updateUser method
          const stmt = services.databaseService.db.prepare(`
            UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);
          await stmt.bind(hashedPassword, dbUser.id).run();

          results.push({
            email: userData.email,
            status: 'updated',
            oldHash: dbUser.password_hash?.substring(0, 20) + '...',
            newHash: hashedPassword.substring(0, 20) + '...'
          });
        } else {
          results.push({
            email: userData.email,
            status: 'not_found'
          });
        }
      } catch (error) {
        results.push({
          email: userData.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return c.json({
      success: true,
      message: 'Password update completed',
      results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug endpoint to check actual database content
app.get("/api/debug/check-db-users", async (c) => {
  try {
    const services = c.get('services');

    // Get all users from database
    const allUsers = await services.databaseService.getAllUsers();

    const userInfo = allUsers.map((user: any) => ({
      id: user.id,
      email: user.email,
      password_hash: user.password_hash?.substring(0, 20) + '...',
      role: user.role,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    }));

    return c.json({
      success: true,
      totalUsers: allUsers.length,
      users: userInfo
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Force fresh database query (bypass any caching)
app.get("/api/debug/fresh-db-check", async (c) => {
  try {
    const services = c.get('services');

    // Force fresh query with timestamp
    const timestamp = Date.now();
    console.log(`Fresh DB query at ${timestamp}`);

    // Direct database query
    const stmt = services.databaseService.db.prepare(`
      SELECT id, email, password_hash, role, is_active, updated_at
      FROM users
      WHERE email IN ('user@test.com', 'admin@kisigua.com')
      ORDER BY email
    `);
    const users = await stmt.all();

    console.log('Fresh database results:', users);

    return c.json({
      success: true,
      timestamp,
      query: 'Fresh database query executed',
      users: users.results?.map((user: any) => ({
        id: user.id,
        email: user.email,
        password_hash: user.password_hash?.substring(0, 20) + '...',
        role: user.role,
        is_active: user.is_active,
        updated_at: user.updated_at
      })) || []
    });
  } catch (error) {
    console.error('Fresh DB query error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ===== FAVORITES ENDPOINTS =====

// Get user's favorites (authenticated)
app.get("/api/favorites", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const favorites = await services.favoritesService.getUserFavorites(auth.userId);
    return c.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return c.json({ error: "Failed to fetch favorites" }, 500);
  }
});

// Add to favorites (authenticated)
app.post("/api/favorites", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const { listingId } = await c.req.json();

    if (!listingId) {
      return c.json({ error: "Listing ID is required" }, 400);
    }

    const favorite = await services.favoritesService.addToFavorites(auth.userId, listingId);

    // Log activity
    await services.activityService.logFavoriteAdded(auth.userId, listingId, 'Listing');

    return c.json({ favorite });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    if (error instanceof Error && error.message === 'Listing already in favorites') {
      return c.json({ error: error.message }, 409);
    }
    return c.json({ error: "Failed to add to favorites" }, 500);
  }
});

// Remove from favorites (authenticated)
app.delete("/api/favorites/:listingId", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const listingId = c.req.param('listingId');

    const success = await services.favoritesService.removeFromFavorites(auth.userId, listingId);

    if (!success) {
      return c.json({ error: "Favorite not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return c.json({ error: "Failed to remove from favorites" }, 500);
  }
});

// Check if listing is favorited (authenticated)
app.get("/api/favorites/check/:listingId", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const listingId = c.req.param('listingId');

    const isFavorited = await services.favoritesService.isListingFavorited(auth.userId, listingId);
    return c.json({ isFavorited });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return c.json({ error: "Failed to check favorite status" }, 500);
  }
});

// Get user's favorite collections (authenticated)
app.get("/api/favorites/collections", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const collections = await services.favoritesService.getUserCollections(auth.userId);
    return c.json({ collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return c.json({ error: "Failed to fetch collections" }, 500);
  }
});

// Create favorite collection (authenticated)
app.post("/api/favorites/collections", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const { name, description, color, isPublic } = await c.req.json();

    if (!name) {
      return c.json({ error: "Collection name is required" }, 400);
    }

    const collection = await services.favoritesService.createCollection(
      auth.userId,
      name,
      description,
      color,
      isPublic
    );

    return c.json({ collection });
  } catch (error) {
    console.error('Error creating collection:', error);
    return c.json({ error: "Failed to create collection" }, 500);
  }
});

// ===== DASHBOARD STATS ENDPOINTS =====

// Get dashboard statistics (admin only)
app.get("/api/admin/dashboard/stats", authMiddleware, roleMiddleware(['admin']), async (c) => {
  try {
    const services = c.get('services');
    const stats = await services.statsService.getDashboardStats();
    return c.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return c.json({ error: "Failed to fetch dashboard statistics" }, 500);
  }
});

// Get user statistics (authenticated)
app.get("/api/user/stats", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const stats = await services.statsService.getUserStats(auth.userId);
    return c.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return c.json({ error: "Failed to fetch user statistics" }, 500);
  }
});

// ===== PUBLIC LISTINGS ENDPOINTS =====

// Get all public listings (no authentication required) - only active listings
app.get("/api/listings", async (c) => {
  try {
    const services = c.get('services');
    console.log('Public requesting active listings for dashboard...');

    // Use the search method that filters by status = 'active' for public view
    const searchResult = await services.databaseService.searchListings({
      query: '',
      filters: {},
      page: 1,
      limit: 100 // Get all active listings
    });

    console.log(`Public listings endpoint returning ${searchResult.listings.length} active listings`);

    return c.json({ listings: searchResult.listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return c.json({ error: "Failed to fetch listings" }, 500);
  }
});



// Serve static files for non-API routes
app.get("*", async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;

  // If it's an API route that wasn't matched, return 404
  if (path.startsWith('/api/')) {
    return c.json({ error: 'API endpoint not found' }, 404);
  }

  // For all other routes, serve the React app
  try {
    // Try to get the specific file first
    let assetPath = path === '/' ? '/index.html' : path;

    // If the path doesn't have an extension, serve index.html (SPA routing)
    if (!assetPath.includes('.')) {
      assetPath = '/index.html';
    }

    const response = await c.env.FILES.get(`client${assetPath}`);

    if (!response) {
      // If file not found, serve index.html for SPA routing
      const indexResponse = await c.env.FILES.get('client/index.html');
      if (!indexResponse) {
        return c.text('Application not found', 404);
      }

      return new Response(indexResponse.body, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Determine content type
    let contentType = 'text/plain';
    if (assetPath.endsWith('.html')) contentType = 'text/html';
    else if (assetPath.endsWith('.js')) contentType = 'application/javascript';
    else if (assetPath.endsWith('.css')) contentType = 'text/css';
    else if (assetPath.endsWith('.png')) contentType = 'image/png';
    else if (assetPath.endsWith('.jpg') || assetPath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (assetPath.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (assetPath.endsWith('.ico')) contentType = 'image/x-icon';

    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': assetPath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000'
      }
    });
  } catch (error) {
    console.error('Static file serving error:', error);
    return c.text('Internal Server Error', 500);
  }
});

export default app;
