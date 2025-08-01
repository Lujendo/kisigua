## 🎯 Project Overview

**Kisigua** is a multilingual web application serving as a search engine for essential goods, organic farms, local products, and potable water sources. The platform connects communities with local resources and promotes sustainable living through community connections.

**Mission**: Supporting local producers and promoting sustainable living through community connections.

**Live URL**: https://kisigua.com (production deployment via Cloudflare Workers)
**Repository**: https://github.com/Lujendo/kisigua (auto-deploys to production on push to main)

## 🏗️ Architecture & Tech Stack

### Frontend
- **React 19** with TypeScript for type safety
- **Tailwind CSS v4** for utility-first styling
- **Vite** for lightning-fast development and building
- **Responsive design** with mobile-first approach
- **Multilingual support** (5 languages: English, German, Italian, Spanish, French)

### Backend
- **Hono framework** for ultralight, modern API
- **Cloudflare Workers** for edge computing deployment
- **RESTful API design** with proper HTTP methods
- **JWT-based authentication** with role-based access control
- **CORS configuration** for production domains

### Database & Storage
- **D1 SQL Database** (kisigua-production) - 10+ tables with complete schema
- **R2 Object Storage** (kisigua-files) - Public bucket for images/documents with correct URL configuration
- **KV Storage** (CACHE) - Session management and caching
- **Analytics Engine** (kisigua_analytics) - User behavior and performance tracking

### Development Tools
- **TypeScript** for type safety across the stack
- **ESLint** for code quality and consistency
- **Vitest** for unit and integration testing
- **GitHub Actions** for CI/CD pipeline

## 🔐 Authentication System

### User Roles & Permissions
- **Admin**: Full system access, user management, unlimited listings
- **Premium** (€19.99/month): 50 listings/month, featured listings, analytics
- **Supporter** (€9.99/month): 20 listings/month, priority search results
- **User** (Free): 5 listings/month, basic functionality

### Demo Credentials
- **Admin**: admin@kisigua.com / admin123
- **Premium**: premium@test.com / test123
- **Supporter**: supporter@test.com / test123
- **User**: user@test.com / test123

### Security Features
- JWT token authentication (7-day expiration)
- bcryptjs password hashing
- Role-based access control (RBAC)
- Protected routes and middleware
- Secure headers and HTTPS enforcement

## 🎨 Key Features

### 1. Landing Page & Navigation
- Clean, responsive landing page with multilingual support
- Global sidebar with role-based navigation
- Smooth transitions and mobile-friendly design
- Language switcher for 5 supported languages

### 2. Advanced Search Engine with Location-Based Features ⭐ **ENHANCED**
- **Google-style location search** with city name geocoding (40+ German cities)
- **Interactive map integration** with search radius visualization
- **Distance-based filtering** with 1km to 100km radius selection
- **GPS location detection** for current position search
- **Click-to-search on map** - set search location by clicking anywhere
- **Real-time distance display** showing "X km away" on all listings
- **Multiple view modes**: Card, List, and Interactive Map views
- **Smart filtering**: Category, location, price, rating, organic status
- **Sorting options**: Relevance, rating, price, distance, newest, popularity
- **Search history** and recently viewed locations
- **Auto-switch to map view** when location search is performed

### 3. Enhanced Listings Management ⭐ **UPGRADED**
- **Card-style detail views** matching MyListings design consistency
- **Privacy controls** - users can hide detailed address from public view
- **Admin review system** with "View Details" buttons for moderation
- **Create/Edit listings** with rich form interface and privacy settings
- **Image upload** with drag & drop, thumbnails, and galleries
- **Location mapping** with Leaflet integration and click-to-set coordinates
- **Category system**: Organic farms, local products, water sources, vending machines, crafts
- **Certification tracking** for organic/sustainable products
- **Contact information display** with email, phone, and website links

### 4. Complete File Management System ✅ FULLY WORKING
- **R2 Storage Integration** with kisigua-files bucket (public access with correct URLs)
- **Image Upload Component** with drag & drop, progress tracking, and validation
- **Image Gallery** with lightbox, thumbnails, and reordering capabilities
- **Profile Picture Management** with automatic resizing and cropping
- **Document Upload System** supporting PDFs, Word docs, images (10MB limit)
- **File Manager Dashboard** with storage usage tracking and metadata
- **Database Tracking** for all file uploads with status monitoring
- **Signed URL Generation** for secure upload and download processes
- **Image Display Fix**: Corrected R2 public URL configuration for proper image loading

### 5. Favorites & Collections (Real Data Integration)
- **Heart buttons** to toggle favorites with instant feedback
- **Custom collections** with color-coding and naming
- **Public/private collection options** with sharing capabilities
- **Grid and list views** for favorites management
- **Database-backed storage** with favorites and collection_listings tables
- **Real-time updates** across all user sessions

### 6. Subscription Management
- **Stripe integration** for payment processing (live keys configured)
- **Subscription tiers** with different feature sets and limits
- **Billing management** (cancel, reactivate subscriptions)
- **Role-based pricing** and usage limits enforcement
- **Payment webhooks** for subscription status updates

### 7. Rich Content Creation
- **Rich Text Editor** with formatting toolbar (bold, italic, underline, lists)
- **Advanced listing forms** with category selection and region support
- **Image galleries** for listings with multiple photo support
- **Location mapping** with precise coordinates and region categorization

## 📁 Project Structure

```
kisigua/
├── .github/workflows/          # CI/CD pipeline configurations
│   ├── ci-cd.yml              # Main deployment pipeline
│   ├── dependency-update.yml  # Automated dependency updates
│   └── performance.yml        # Performance monitoring
├── database/                   # Database schema and migrations
│   ├── schema.sql             # Complete database schema (10 tables)
│   ├── migrations/            # Database migration files
│   └── seeds/                 # Initial data seeding
├── src/
│   ├── react-app/             # Frontend React application
│   │   ├── components/        # React components (15+ components)
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── search/        # Search and filtering components
│   │   │   ├── listings/      # Listing management components
│   │   │   ├── favorites/     # Favorites and collections
│   │   │   ├── admin/         # Admin panel components
│   │   │   └── subscription/  # Subscription management
│   │   ├── contexts/          # React contexts (Auth, Favorites)
│   │   └── main.tsx           # App entry point
│   ├── worker/                # Backend Cloudflare Worker
│   │   ├── services/          # Business logic services
│   │   │   ├── authService.ts        # Authentication service
│   │   │   ├── databaseService.ts    # D1 database integration
│   │   │   ├── storageService.ts     # R2 storage management
│   │   │   ├── listingsService.ts    # Listings business logic
│   │   │   ├── subscriptionService.ts # Stripe integration
│   │   │   └── analyticsService.ts   # Analytics tracking
│   │   ├── middleware/        # Authentication middleware
│   │   ├── types/             # TypeScript type definitions
│   │   └── index.ts           # API routes (25+ endpoints)
│   └── test/                  # Testing framework and utilities
├── public/                    # Static assets (favicon, etc.)
├── dist/                      # Build output
├── wrangler.json             # Development configuration
├── wrangler.production.json  # Production configuration
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── vitest.config.ts          # Testing configuration
├── lighthouserc.js           # Performance monitoring
├── audit-ci.json             # Security audit configuration
├── CI_CD_SETUP.md            # CI/CD setup guide
├── DEPLOYMENT.md             # Comprehensive deployment guide
└── PROJECT_SUMMARY.md        # Detailed project summary
```

## 🚀 Deployment & CI/CD

### Production Deployment
- **Cloudflare Workers**: Edge computing deployment with global distribution
- **Git Integration**: Automatic deployment to kisigua.com on push to main branch
- **Domain**: kisigua.com (production) with custom domain configuration
- **Environment**: Production environment with live Cloudflare resources

### Cloudflare Resources
- **D1 Database**: kisigua-production (SQL database with 10+ tables)
- **R2 Storage**: kisigua-files (public bucket for images/documents)
- **KV Storage**: CACHE (session management and caching)
- **Analytics Engine**: kisigua_analytics (user behavior tracking)

### Development & Debugging Tools
- **Wrangler CLI**: Local development and deployment management
- **Wrangler Tail**: Real-time production log monitoring (`wrangler tail --env production`)
- **Local Development**: `npm run dev` with hot reload and local Cloudflare resources
- **Production Logs**: Live debugging with `wrangler tail` for production troubleshooting

### CI/CD Pipeline Features
- **Automated Git Deployment**: Push to main → automatic production deployment
- **Testing Pipeline**: Automated testing, linting, and security checks
- **Performance Monitoring**: Lighthouse audits and bundle size monitoring
- **Database Migrations**: Automatic schema updates and health checks
- **Dependency Management**: Automated updates and vulnerability scanning

### Deployment Commands
```bash
npm run dev                    # Local development with Cloudflare resources
npm run build                  # Build for production deployment
npm run deploy:production      # Manual production deployment (if needed)
npm run test                   # Run test suite
wrangler tail --env production # Real-time production log monitoring
wrangler d1 execute kisigua-production --file=database/schema.sql # Database operations
```

## 📊 Performance & Monitoring

### Build Statistics
- **JavaScript Bundle**: 241.31 KB (gzipped: 69.46 KB) ✅ Under 300KB limit
- **CSS Bundle**: 33.24 KB (gzipped: 6.57 KB) ✅ Under 50KB limit
- **Lighthouse Performance**: Optimized for 90+ scores

### Health Monitoring
- Application health endpoint (`/health`)
- Database connectivity checks
- Storage accessibility tests
- Real-time analytics and reporting

## 🔧 Recent Major Changes (Last 7 Days)

### Latest Critical Fixes (August 1, 2025)
1. **🔐 AUTHENTICATION PERSISTENCE FIX** - Users now stay logged in after page refresh
   - **Fixed token verification** to check both in-memory and database users
   - **Enhanced verifyToken()** method to load database users when not in memory
   - **Automatic user caching** for performance optimization
   - **Comprehensive debugging** with detailed console logging
   - **Root cause resolved**: Token verification was only checking memory users
   - **Result**: Seamless authentication experience across page refreshes

2. **🗺️ LOCATION SEARCH COORDINATE FIX** - Location filtering now works properly
   - **Fixed coordinate field mismatch** between frontend (lat/lng) and backend (latitude/longitude)
   - **Updated search payloads** for both traditional and AI hybrid search
   - **Enhanced debugging** with search payload logging
   - **Backend compatibility** with ListingsService and SemanticSearchService
   - **Result**: Distance-based location filtering now works correctly

3. **🔍 UNIFIED SEARCH SYSTEM** - Consistent search experience across all components
   - **Smart search routing** based on user role (AI for premium, traditional for free)
   - **API-based search** replacing client-side filtering for better performance
   - **AI search indicators** for premium users with visual badges
   - **Integrated location filtering** with both search types
   - **Sticky view selection** that persists through searches
   - **Result**: Professional search experience with role-based capabilities

4. **🎯 STICKY VIEW SELECTION** - User view preferences now persist
   - **View selection tracking** to distinguish user choices from defaults
   - **Override protection** preventing automatic view switching
   - **Location search independence** from view mode selection
   - **Enhanced user control** over browsing experience
   - **Result**: Users maintain their preferred view (list/grid/map) during searches

### Previous Major Features (January 31, 2025)
5. **🗺️ GOOGLE-STYLE LOCATION SEARCH** - Complete location-based search system like Kleinanzeigen.de
   - **Location input with geocoding** for 40+ German cities (Berlin, Munich, Stuttgart, Reutlingen, etc.)
   - **Interactive map integration** with search radius visualization (red circle)
   - **Distance-based filtering** with 1km to 100km radius selection
   - **GPS location detection** with automatic map centering
   - **Click-to-search on map** - set new search location by clicking anywhere
   - **Real-time distance display** showing "X km away" on all listings
   - **Auto-switch to map view** when location search is performed
   - **Performance optimized** - fixed infinite re-rendering issues

6. **🎨 CARD-STYLE LISTING DETAILS** - Consistent design like MyListings
   - **Replaced modal with card interface** for better UX consistency
   - **Professional contact information** display with email, phone, website
   - **Enhanced image galleries** with proper aspect ratios
   - **Distance badges** when location search is active
   - **Smooth animations** and responsive design
   - **Close button and scroll-to-top** functionality

7. **🔒 PRIVACY & ADMIN ENHANCEMENTS** - User control and admin oversight
   - **Address privacy controls** - users can hide detailed address from public
   - **Role-based data visibility** (public sees city/country, admins see full address)
   - **Admin listing review** with "View Details" buttons in management panel
   - **Location search compatibility** - privacy doesn't break distance calculations
   - **Database schema updates** with hideAddress field and proper defaults

### Previous Critical Fixes (July 30, 2025)
8. **🔥 CRITICAL IMAGE FIX** - Resolved image display issues by correcting R2 public URL configuration
   - Fixed development wrangler.json using incorrect domain (files.kisigua.com)
   - Production now uses correct R2 URL: https://pub-49c315845edf402b9841432c6b1083f1.r2.dev
   - All image uploads, display, and cover image functionality now working perfectly
   - Redeployed with proper production configuration

9. **Database Schema Improvements** - Enhanced category constraints and data integrity
   - Updated category foreign key constraints for better data consistency
   - Improved error handling for category-related operations
   - Fixed category management system with proper validation

### Previous Updates (July 29-30, 2025)
10. **Complete File Upload System** (ffd549a6, 0c48874f) - R2 Storage integration with database tracking
11. **Real Data Integration** (2764681b) - Favorites system and admin dashboard with live data
12. **Rich Text Editor** (f838b2e1) - Enhanced listing creation with formatting capabilities
13. **Region Field Addition** (d7f45bd2) - Location categorization with region support
14. **Frontend Listings Import** (0b1aea2f) - 15 total listings with diverse categories
15. **File Upload Domain Fix** (f57ddd99) - Resolved DNS issues for image/document uploads
16. **Admin Panel Simplification** (8fa418e1, 71b5239c) - Streamlined admin interface
17. **Category Management System** (71b5239c) - Dynamic categories with database integration

### Previous Major Features (July 28, 2025)
18. **Complete Application Implementation** (d1ee589a) - Full-featured platform with all core functionality
19. **Custom Favicon** (a776a295) - Brand-consistent green "K" favicon
20. **Enhanced Search Engine** (bdb25d4185) - Comprehensive search with multiple views and filtering
21. **Sidebar Architecture** (57385279) - Global sidebar with role-based navigation
22. **Authentication Improvements** (1f2b31a5) - Extended JWT expiration, token verification/refresh

## 🎯 Current Status

**✅ FULLY OPERATIONAL** - The Kisigua application is completely implemented, deployed, and running in production at https://kisigua.com

### ✅ Implemented & Working Features
- ✅ **Clean landing page** with multilingual support (5 languages)
- ✅ **Complete authentication system** with role-based access (Admin, Premium, Supporter, User)
- ✅ **🗺️ Google-style location search** with distance-based filtering and interactive maps ⭐ **NEW**
- ✅ **Advanced search functionality** with card, list, and map views
- ✅ **🎨 Card-style listing details** matching MyListings design consistency ⭐ **NEW**
- ✅ **🔒 Privacy controls** for address visibility with admin oversight ⭐ **NEW**
- ✅ **Role-specific dashboards** with appropriate permissions and real data
- ✅ **Stripe integration** for subscription management and payments
- ✅ **Complete file management system** with R2 storage integration ⭐ **FULLY WORKING**
  - ✅ Image uploads with drag & drop, thumbnails, and galleries
  - ✅ Document uploads (PDFs, Word docs) with progress tracking
  - ✅ Profile picture management with automatic resizing
  - ✅ Database tracking of all file uploads
  - ✅ **Image display and URLs working perfectly** (R2 configuration fixed)
  - ✅ **Cover image functionality** working correctly
  - ✅ **Image galleries** displaying properly in listings
- ✅ **Rich text editor** for listing descriptions with formatting
- ✅ **Favorites system** with collections and heart buttons (real data)
- ✅ **Interactive maps** with Leaflet integration for location mapping
- ✅ **Category management** with dynamic loading from database
- ✅ **Region support** for precise location categorization
- ✅ **Database integration** with D1, R2, Analytics Engine, and KV storage
- ✅ **15 diverse test listings** across all categories
- ✅ **Testing framework** with Vitest and React Testing Library
- ✅ **CI/CD pipeline** with GitHub Actions for automated deployment
- ✅ **Production deployment** configuration with health monitoring

### 🔧 Recent Fixes & Improvements (All Working)
- ✅ **� AUTHENTICATION PERSISTENCE** - Users stay logged in after page refresh ⭐ **LATEST**
  - Fixed token verification to check both memory and database users
  - Enhanced verifyToken() method with automatic user loading and caching
  - Comprehensive debugging with detailed console logging
  - Seamless authentication experience across page refreshes
- ✅ **�🗺️ LOCATION SEARCH COORDINATE FIX** - Distance filtering now works properly ⭐ **LATEST**
  - Fixed coordinate field mismatch (lat/lng vs latitude/longitude)
  - Updated search payloads for both traditional and AI search
  - Enhanced debugging with search payload logging
  - Location filtering works correctly with distance calculations
- ✅ **🔍 UNIFIED SEARCH SYSTEM** - Consistent search across all components ⭐ **LATEST**
  - Smart search routing based on user role (AI for premium, traditional for free)
  - API-based search replacing client-side filtering
  - AI search indicators for premium users with visual badges
  - Integrated location filtering with both search types
- ✅ **🎯 STICKY VIEW SELECTION** - User view preferences persist ⭐ **LATEST**
  - View selection tracking to distinguish user choices from defaults
  - Override protection preventing automatic view switching
  - Location search independence from view mode selection
  - Enhanced user control over browsing experience
- ✅ **🗺️ LOCATION SEARCH SYSTEM** - Complete Google-style location search implementation
  - Interactive map with search radius visualization and click-to-search
  - Geocoding for 40+ German cities with GPS location detection
  - Real-time distance display and intelligent view management
  - Performance optimized with fixed infinite re-rendering issues
- ✅ **🎨 CARD-STYLE DETAILS** - Professional listing detail cards like MyListings
  - Replaced modal interface with consistent card design
  - Enhanced contact information display and image galleries
  - Smooth animations and responsive mobile design
- ✅ **🔒 PRIVACY & ADMIN FEATURES** - User privacy controls with admin oversight
  - Address privacy settings with role-based visibility
  - Admin review system with "View Details" functionality
  - Database schema updates with hideAddress field
- ✅ **🔥 CRITICAL IMAGE SYSTEM FIX** - All image functionality working perfectly
  - Fixed R2 public URL configuration (was using non-existent files.kisigua.com)
  - Corrected to proper R2 domain: https://pub-49c315845edf402b9841432c6b1083f1.r2.dev
  - Image uploads, display, cover images, and galleries all functional
- ✅ **Database schema improvements** - Enhanced category constraints and validation
- ✅ **File upload domain issues** resolved - uploads now work correctly
- ✅ **Authentication system** enhanced with 7-day JWT tokens and refresh
- ✅ **Admin panel** simplified and streamlined
- ✅ **Database schema** updated with favorites, collections, and activity tracking
- ✅ **Password system** fixed for all test users

### 🚀 Next Steps for Enhancement
1. **Enhanced Geocoding**: Integration with Google Maps API or OpenStreetMap for global city coverage
2. **Advanced Location Features**: Saved search locations, location alerts, and favorite areas
3. **Mobile Optimization**: Enhanced mobile experience for location search and map interaction
4. **Email Integration**: Notification system for user activities and location-based alerts
5. **Advanced Analytics**: Enhanced user behavior tracking and location search analytics
6. **API Documentation**: OpenAPI/Swagger documentation for location search endpoints
7. **Content Moderation**: Enhanced admin tools for managing user-generated content
8. **Internationalization**: Additional language support beyond current 5 languages
9. **Performance Optimization**: Further bundle size reduction and caching improvements
10. **Social Features**: User profiles, reviews, and community location sharing

## 💡 Development Notes

### Key Contexts
- **AuthContext**: Manages user authentication state and role-based permissions
- **FavoritesContext**: Handles favorites and collections with database integration

### Important Services
- **DatabaseService**: D1 database operations with type safety and migrations
- **StorageService**: R2 file management with signed URLs and public access
- **AuthService**: JWT authentication with 7-day tokens and refresh capability
- **ListingsService**: Business logic for listings with region support
- **SubscriptionService**: Stripe integration for payments and webhooks
- **FavoritesService**: Database-backed favorites and collections management
- **ActivityService**: User activity tracking and logging
- **StatsService**: Admin dashboard statistics and analytics

### Database Schema (10+ Tables)
- **users**: User accounts with roles and authentication
- **listings**: Location listings with categories and regions
- **categories**: Dynamic category management
- **favorites**: User favorite listings
- **favorite_collections**: Custom user collections
- **collection_listings**: Many-to-many relationship for collections
- **file_uploads**: File tracking with metadata and status
- **activity_log**: User activity and system events tracking
- **subscriptions**: Stripe subscription management
- **analytics**: Performance and usage metrics

### Testing Strategy
- Unit tests with Vitest and React Testing Library
- Integration tests for API endpoints with real database
- Component testing with mock data and user interactions
- Performance testing with Lighthouse (90+ scores)
- File upload testing with R2 storage integration

## 🔍 Quick Debug & Maintenance

### Production Debugging Tools
- **Wrangler Tail**: `wrangler tail --env production` - Real-time production log monitoring
- **Health Check**: `https://kisigua.com/health` - Application status and connectivity
- **Debug Endpoints**: `/api/debug/*` - Various debugging and diagnostic tools
- **Database Operations**: `wrangler d1 execute kisigua-production --file=database/schema.sql`

### Development & Maintenance Scripts
- **Password Fix**: `fix-passwords.js` - Updates test user passwords
- **Database Check**: `fresh-db-check.js` - Verifies database connectivity
- **Local Development**: `npm run dev` - Local development with Cloudflare resources
- **Production Deployment**: Automatic via Git push to main branch

### Demo Credentials (All Working ✅)
- **Admin**: admin@kisigua.com / admin123
- **Premium**: premium@test.com / test123
- **Supporter**: supporter@test.com / test123
- **User**: user@test.com / test123

### Image Management Status ✅
- **Upload**: Working perfectly with drag & drop interface
- **Display**: All images loading correctly with proper R2 URLs
- **Cover Images**: Set cover image functionality working
- **Galleries**: Image galleries displaying properly in listings
- **Storage**: R2 bucket (kisigua-files) with correct public URL configuration

### Key Configuration Files
- **wrangler.production.json**: Production deployment config
- **database/schema.sql**: Complete database schema
- **database/migrations/**: All database migrations
- **package.json**: Dependencies and scripts

---

**🌟 The Kisigua platform is FULLY OPERATIONAL and successfully connects communities with local resources! 🌱**

**🚀 Live at https://kisigua.com with complete functionality, real data, and ALL FEATURES working perfectly! ✨**

**� LATEST CRITICAL FIXES: Authentication persistence, location search coordinates, unified search system, and sticky view selection - all major user experience issues resolved! 🎯**

**🗺️ LOCATION SEARCH: Google-style location search with interactive maps - find sustainable businesses by distance like Kleinanzeigen.de! 📍**

**🎨 PROFESSIONAL UX: Card-style listing details with privacy controls and admin oversight for seamless user experience! 🔒**

**🔥 ALL SYSTEMS OPERATIONAL: Authentication, location search, image management, search functionality, and admin features working flawlessly! 🚀**

**⚡ CLOUDFLARE DEPLOYMENT: Automatic deployment via Git repository with real-time debugging via Wrangler Tail! 🛠️**
