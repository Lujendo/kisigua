# Kisigua Deployment Guide

This guide covers deploying the Kisigua application to Cloudflare Workers with custom domain configuration.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain**: Purchase or transfer `kisura.com` to Cloudflare
3. **Wrangler CLI**: Install globally with `npm install -g wrangler`
4. **Stripe Account**: For payment processing (optional for basic deployment)

## Environment Setup

### 1. Cloudflare Authentication

```bash
# Login to Cloudflare
wrangler auth login

# Verify authentication
wrangler whoami
```

### 2. Environment Variables

Create environment variables in Cloudflare Workers dashboard or use wrangler:

```bash
# JWT Secret for authentication
wrangler secret put JWT_SECRET

# Stripe keys (for production)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Database connection (when implementing persistent storage)
wrangler secret put DATABASE_URL
```

### 3. Update wrangler.json for Production

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "kisigua-production",
  "main": "./src/worker/index.ts",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "upload_source_maps": false,
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application"
  },
  "routes": [
    {
      "pattern": "kisura.com/*",
      "custom_domain": true
    },
    {
      "pattern": "www.kisura.com/*",
      "custom_domain": true
    }
  ],
  "vars": {
    "ENVIRONMENT": "production"
  }
}
```

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Deploy to Cloudflare Workers

```bash
# Deploy to production
wrangler deploy

# Deploy with specific configuration
wrangler deploy --config wrangler.json
```

### 3. Custom Domain Configuration

#### Option A: Using Cloudflare Dashboard

1. Go to Cloudflare Workers dashboard
2. Select your worker (`kisigua-production`)
3. Go to "Settings" → "Triggers"
4. Add custom domain: `kisura.com`
5. Add custom domain: `www.kisura.com` (optional)

#### Option B: Using Wrangler CLI

```bash
# Add custom domain
wrangler custom-domains add kisura.com

# Add www subdomain
wrangler custom-domains add www.kisura.com
```

### 4. DNS Configuration

Ensure your domain's DNS is managed by Cloudflare:

1. **A Record**: `kisura.com` → `192.0.2.1` (placeholder, will be overridden by Workers)
2. **CNAME Record**: `www.kisura.com` → `kisura.com`
3. **Workers Route**: Configured automatically when adding custom domain

## Production Configuration

### 1. Security Headers

The application includes security headers for production:

- CORS configuration for `kisura.com`
- Content Security Policy
- HTTPS enforcement

### 2. Performance Optimization

- Gzip compression enabled
- Static asset caching
- Edge caching for API responses
- Minified JavaScript and CSS

### 3. Monitoring and Analytics

- Cloudflare Analytics enabled
- Error tracking with Sentry (optional)
- Performance monitoring
- Real User Monitoring (RUM)

## Environment-Specific Configurations

### Development
```bash
# Run locally
npm run dev

# Deploy to development environment
wrangler deploy --env development
```

### Staging
```bash
# Deploy to staging
wrangler deploy --env staging
```

### Production
```bash
# Deploy to production
wrangler deploy --env production
```

## Cloudflare Services Setup

### 1. D1 Database Setup

Create and configure the D1 SQL database:

```bash
# Create D1 database
wrangler d1 create kisigua-production

# Note the database ID from the output and update wrangler.production.json

# Run migrations
wrangler d1 migrations apply kisigua-production --local
wrangler d1 migrations apply kisigua-production --remote

# Seed initial data
wrangler d1 execute kisigua-production --file=./database/seeds/001_initial_data.sql --remote
```

### 2. R2 Storage Setup

Create R2 bucket for file storage:

```bash
# Create R2 bucket
wrangler r2 bucket create kisigua-files

# Create development bucket
wrangler r2 bucket create kisigua-files-dev

# Configure custom domain (optional)
wrangler r2 bucket domain add kisigua-files files.kisura.com
```

### 3. Analytics Engine Setup

Create Analytics Engine dataset:

```bash
# Create analytics dataset
wrangler analytics-engine create kisigua_analytics

# Create development dataset
wrangler analytics-engine create kisigua_analytics_dev
```

### 4. KV Namespace Setup

Create KV namespace for caching:

```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"

# Create preview namespace
wrangler kv:namespace create "CACHE" --preview

# Note the IDs and update wrangler configuration files
```

### 5. Database Migrations

The application includes a complete database schema and migration system:

```bash
# Apply initial schema
wrangler d1 execute kisigua-production --file=./database/schema.sql

# Apply migrations
wrangler d1 migrations apply kisigua-production

# Seed development data
wrangler d1 execute kisigua-production --file=./database/seeds/001_initial_data.sql
```

## SSL/TLS Configuration

Cloudflare automatically provides SSL certificates for custom domains:

1. **Universal SSL**: Automatically enabled
2. **Advanced Certificate Manager**: For custom certificates
3. **Always Use HTTPS**: Redirect HTTP to HTTPS

## Backup and Recovery

1. **Code Repository**: GitHub backup
2. **Database Backups**: Automated D1 backups
3. **Configuration Backup**: Export wrangler.json
4. **Environment Variables**: Document all secrets

## Monitoring and Maintenance

### Health Checks

The application includes health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/` - API status

### Logging

- Cloudflare Workers logs
- Custom application logging
- Error tracking and alerting

### Performance Monitoring

- Response time monitoring
- Error rate tracking
- User analytics
- Geographic performance data

## Troubleshooting

### Common Issues

1. **Domain not resolving**: Check DNS configuration
2. **SSL errors**: Verify certificate status
3. **API errors**: Check environment variables
4. **Build failures**: Verify dependencies

### Debug Commands

```bash
# View logs
wrangler tail

# Check deployment status
wrangler deployments list

# Test locally
wrangler dev
```

## Cost Optimization

### Cloudflare Workers Pricing

- **Free Tier**: 100,000 requests/day
- **Paid Tier**: $5/month for 10M requests
- **Additional**: $0.50 per million requests

### Optimization Tips

1. Cache static assets
2. Optimize API responses
3. Use edge caching
4. Minimize worker execution time

## Security Considerations

1. **Environment Variables**: Never commit secrets
2. **CORS Configuration**: Restrict to production domains
3. **Rate Limiting**: Implement API rate limits
4. **Input Validation**: Validate all user inputs
5. **Authentication**: Secure JWT implementation

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure backup procedures
3. Implement CI/CD pipeline
4. Set up staging environment
5. Configure database (if needed)
6. Implement analytics tracking
7. Set up error monitoring

## Support

For deployment issues:

1. Check Cloudflare Workers documentation
2. Review Wrangler CLI documentation
3. Contact Cloudflare support
4. Check community forums

---

**Note**: This deployment guide assumes basic familiarity with Cloudflare Workers and DNS configuration. For production deployments, consider implementing additional security measures and monitoring solutions.
