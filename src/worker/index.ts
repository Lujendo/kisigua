import { Hono } from "hono";
import { cors } from "hono/cors";
import { AuthService } from "./services/authService";
import { ListingsService } from "./services/listingsService";
import { SubscriptionService } from "./services/subscriptionService";
import { DatabaseService } from "./services/databaseService";
import { StorageService } from "./services/storageService";
import { AnalyticsService } from "./services/analyticsService";
import {
  createAuthMiddleware,
  createRoleMiddleware
} from "./middleware/auth";
import { LoginRequest, RegisterRequest, UserRole } from "./types/auth";
import { SearchQuery, CreateListingRequest, UpdateListingRequest } from "./types/listings";
import { CreateCheckoutSessionRequest } from "./types/subscription";

interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  ANALYTICS: AnalyticsEngineDataset;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  ENVIRONMENT: string;
  APP_URL: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// Initialize services (will be done per request to access bindings)
function initializeServices(env: Env) {
  console.log('=== INITIALIZING SERVICES ===');
  const databaseService = new DatabaseService(env.DB);
  const storageService = new StorageService(env.FILES, env.R2_BUCKET_NAME, env.R2_PUBLIC_URL);
  const analyticsService = new AnalyticsService(env.ANALYTICS, env.DB);

  console.log('Creating AuthService with JWT_SECRET:', env.JWT_SECRET ? 'SET' : 'USING FALLBACK');
  const authService = new AuthService(env.JWT_SECRET || 'your-secret-key-change-in-production', databaseService);
  console.log('AuthService created successfully');

  const listingsService = new ListingsService();
  const subscriptionService = new SubscriptionService(env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');
  console.log('=== SERVICES INITIALIZED ===');

  return {
    databaseService,
    storageService,
    analyticsService,
    authService,
    listingsService,
    subscriptionService
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
  const services = initializeServices(c.env);
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
  await middleware(c, next);
};

// Helper middleware for role checking
const roleMiddleware = (roles: UserRole[]) => async (c: any, next: any) => {
  const middleware = createRoleMiddleware(roles);
  await middleware(c, next);
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
    const statusCode = result.success ? 200 : 401;

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

// Get single listing (public)
app.get("/api/listings/:id", async (c) => {
  const services = c.get('services');
  const listingId = c.req.param('id');
  const listing = await services.listingsService.getListing(listingId);

  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  return c.json({ listing });
});

// Create listing (authenticated)
app.post("/api/listings", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const data = await c.req.json() as CreateListingRequest;

    const listing = await services.listingsService.createListing(auth.userId, data);
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

    const isAdmin = auth.role === 'admin';
    const listing = await services.listingsService.updateListing(listingId, auth.userId, data, isAdmin);

    if (!listing) {
      return c.json({ error: "Listing not found or access denied" }, 404);
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

  return c.json({ success: true });
});

// Get user's listings (authenticated)
app.get("/api/user/listings", authMiddleware, async (c) => {
  const services = c.get('services');
  const auth = c.get('auth');
  const listings = await services.listingsService.getUserListings(auth.userId);
  return c.json({ listings });
});

// Admin: Get all listings
app.get("/api/admin/listings", authMiddleware, roleMiddleware(['admin']), async (c) => {
  const services = c.get('services');
  const listings = await services.listingsService.getAllListings();
  return c.json({ listings });
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
app.post("/api/upload/:fileId", async (c) => {
  try {
    const services = c.get('services');
    const fileId = c.req.param('fileId');
    const contentType = c.req.header('content-type') || 'application/octet-stream';

    const fileData = await c.req.arrayBuffer();
    const r2Key = `temp/${fileId}`;

    const result = await services.storageService.uploadFile(
      r2Key,
      fileData,
      contentType
    );

    return c.json(result);
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
app.delete("/api/files/:fileKey", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const fileKey = c.req.param('fileKey');

    // Verify user owns the file (basic check - in production you'd check database)
    if (!fileKey.includes(auth.userId)) {
      return c.json({ error: "Access denied" }, 403);
    }

    const success = await services.storageService.deleteFile(fileKey);

    if (success) {
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

    let prefix = `uploads/${auth.userId}/`;
    if (type === 'images') {
      prefix = `listings/`;
    } else if (type === 'documents') {
      prefix = `documents/${auth.userId}/`;
    } else if (type === 'profile') {
      prefix = `profiles/${auth.userId}/`;
    }

    const files = await services.storageService.listFiles(prefix, 100);

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
