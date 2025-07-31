import { Hono } from "hono";
import { cors } from "hono/cors";
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
  const storageService = new StorageService(env.FILES, env.DB, env.R2_BUCKET_NAME, env.R2_PUBLIC_URL);
  const analyticsService = new AnalyticsService(env.ANALYTICS, env.DB);
  const categoryService = new CategoryService(env.DB);
  const favoritesService = new FavoritesService(env.DB);
  const activityService = new ActivityService(env.DB);
  const statsService = new StatsService(env.DB);

  console.log('Creating AuthService with JWT_SECRET:', env.JWT_SECRET ? 'SET' : 'USING FALLBACK');
  const authService = new AuthService(env.JWT_SECRET || 'your-secret-key-change-in-production', databaseService);
  console.log('AuthService created successfully');

  const listingsService = new ListingsService(databaseService);
  const duplicateDetectionService = new DuplicateDetectionService(databaseService);
  const subscriptionService = new SubscriptionService(env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');
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
    listingsService,
    duplicateDetectionService,
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
  try {
    const services = c.get('services');
    const listingId = c.req.param('id');

    // First try to get from database
    const listing = await services.databaseService.getFullListingById(listingId);

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
    const highConfidenceDuplicates = duplicates.filter(d => d.confidence >= 80);
    if (highConfidenceDuplicates.length > 0) {
      return c.json({
        error: "Potential duplicate listing detected",
        duplicates: highConfidenceDuplicates.map(d => ({
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

    // Add default images if none provided
    const defaultImages = data.images && data.images.length > 0 ? data.images : [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'
    ];

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

// Admin: Get all listings
app.get("/api/admin/listings", authMiddleware, roleMiddleware(['admin']), async (c) => {
  const services = c.get('services');
  const listings = await services.listingsService.getAllListings();
  return c.json({ listings });
});

// Check for duplicates without creating (authenticated)
app.post("/api/listings/check-duplicates", authMiddleware, async (c) => {
  try {
    const services = c.get('services');
    const auth = c.get('auth');
    const data = await c.req.json() as CreateListingRequest;

    const duplicates = await services.duplicateDetectionService.checkForDuplicates(data, auth.userId);

    return c.json({
      duplicates: duplicates.map(d => ({
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

// Get all public listings (no authentication required)
app.get("/api/listings", async (c) => {
  try {
    const services = c.get('services');
    const listings = await services.listingsService.getAllListings();
    return c.json({ listings });
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
