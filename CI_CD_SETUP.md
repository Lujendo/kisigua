# CI/CD Pipeline Setup Guide

This guide explains how to set up the automated CI/CD pipeline for the Kisigua project using GitHub Actions.

## Overview

The CI/CD pipeline includes:

- **Continuous Integration**: Automated testing, linting, and security checks
- **Continuous Deployment**: Automated deployment to development and production environments
- **Performance Monitoring**: Regular performance audits and health checks
- **Dependency Management**: Automated dependency updates and security scanning

## Required Secrets

Set up the following secrets in your GitHub repository settings:

### Cloudflare Secrets
```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

### Optional Secrets
```
SLACK_WEBHOOK_URL=your_slack_webhook_url
SNYK_TOKEN=your_snyk_token
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

## Workflow Files

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Jobs:**
- **Test**: Runs linting, type checking, and unit tests
- **Build**: Builds the application and uploads artifacts
- **Security**: Runs security audits and dependency checks
- **Deploy Dev**: Deploys to development environment (develop branch)
- **Deploy Prod**: Deploys to production environment (main branch)
- **Migrate DB**: Runs database migrations after production deployment
- **Cleanup**: Removes build artifacts

### 2. Dependency Updates (`.github/workflows/dependency-update.yml`)

**Triggers:**
- Weekly schedule (Mondays at 9 AM UTC)
- Manual trigger

**Features:**
- Updates all npm dependencies
- Runs tests to ensure compatibility
- Creates pull request with changes

### 3. Performance Monitoring (`.github/workflows/performance.yml`)

**Triggers:**
- Every 6 hours
- After successful deployments
- Manual trigger

**Features:**
- Lighthouse performance audits
- Web Vitals monitoring
- Uptime and health checks
- Bundle size monitoring
- Database health checks

## Environment Setup

### Development Environment

The development environment is automatically deployed when code is pushed to the `develop` branch.

**URL**: `https://kisigua-dev.your-subdomain.workers.dev`

### Production Environment

The production environment is automatically deployed when code is pushed to the `main` branch.

**URL**: `https://kisura.com`

## Branch Strategy

### Main Branches
- **`main`**: Production-ready code, triggers production deployment
- **`develop`**: Development code, triggers development deployment

### Feature Branches
- Create feature branches from `develop`
- Name format: `feature/description` or `fix/description`
- Create pull requests to merge into `develop`

### Release Process
1. Merge `develop` into `main` for production release
2. Tag the release: `git tag v1.0.0`
3. Push tags: `git push origin --tags`

## Deployment Process

### Automatic Deployment

1. **Development**: Push to `develop` branch
   ```bash
   git checkout develop
   git add .
   git commit -m "feat: add new feature"
   git push origin develop
   ```

2. **Production**: Merge to `main` branch
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

### Manual Deployment

You can also deploy manually using npm scripts:

```bash
# Deploy to development
npm run deploy

# Deploy to production
npm run deploy:production
```

## Monitoring and Alerts

### Health Checks

The pipeline includes automated health checks:

- **Application Health**: `/health` endpoint monitoring
- **Database Health**: D1 database connectivity tests
- **Storage Health**: R2 bucket accessibility tests
- **Performance**: Lighthouse audits and Web Vitals

### Notifications

Configure Slack notifications by setting the `SLACK_WEBHOOK_URL` secret:

1. Create a Slack app and webhook
2. Add the webhook URL to GitHub secrets
3. Receive notifications for:
   - Deployment successes/failures
   - Health check failures
   - Security alerts

## Performance Budgets

The pipeline enforces performance budgets:

- **JavaScript Bundle**: < 300KB
- **CSS Bundle**: < 50KB
- **Lighthouse Performance**: > 80
- **Lighthouse Accessibility**: > 90

## Security Scanning

### Automated Security Checks

- **npm audit**: Checks for known vulnerabilities
- **Snyk**: Advanced security scanning (optional)
- **Dependency updates**: Weekly automated updates

### Manual Security Review

Run security checks locally:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Check with audit-ci
npx audit-ci
```

## Database Migrations

Database migrations are automatically applied after production deployments:

```bash
# Manual migration (if needed)
npx wrangler d1 migrations apply kisigua-production --remote
```

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check Cloudflare API token permissions
   - Verify account ID is correct
   - Check build logs for errors

2. **Tests Fail**
   - Run tests locally: `npm test`
   - Check for TypeScript errors: `npx tsc --noEmit`
   - Verify all dependencies are installed

3. **Health Checks Fail**
   - Check application logs: `npm run logs:production`
   - Verify database and storage connectivity
   - Check environment variables

### Debug Commands

```bash
# Check deployment status
npx wrangler deployments list

# View application logs
npx wrangler tail --config wrangler.production.json

# Test health endpoint
curl https://kisura.com/health

# Check database status
npx wrangler d1 info kisigua-production
```

## Best Practices

### Code Quality

1. **Always run tests locally** before pushing
2. **Use conventional commits** for clear history
3. **Keep pull requests small** and focused
4. **Write meaningful commit messages**

### Security

1. **Never commit secrets** to the repository
2. **Keep dependencies updated** regularly
3. **Review security alerts** promptly
4. **Use environment-specific configurations**

### Performance

1. **Monitor bundle sizes** regularly
2. **Optimize images** before uploading
3. **Use lazy loading** for non-critical resources
4. **Monitor Core Web Vitals**

## Configuration Files

### `audit-ci.json`
Configures security audit thresholds and settings.

### `lighthouserc.js`
Configures Lighthouse CI performance audits.

### Environment Variables

Set these in your Cloudflare Workers environment:

```bash
# Production
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET_KEY=your_production_stripe_key

# Development
JWT_SECRET=your_development_jwt_secret
STRIPE_SECRET_KEY=your_development_stripe_key
```

## Getting Help

If you encounter issues with the CI/CD pipeline:

1. Check the GitHub Actions logs
2. Review this documentation
3. Check Cloudflare Workers dashboard
4. Contact the development team

## Next Steps

After setting up the CI/CD pipeline:

1. Configure monitoring and alerting
2. Set up staging environment (optional)
3. Implement feature flags
4. Add end-to-end tests
5. Set up error tracking (Sentry, etc.)
