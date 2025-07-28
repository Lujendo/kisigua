# Kisigua - Connecting Communities with Local Resources

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Lujendo/kisigua)

Kisigua is a multilingual web application serving as a search engine for essential goods, organic farms, local products, and potable water sources. Built with React, Vite, Hono, and deployed on Cloudflare Workers.

🌱 **Mission**: Supporting local producers and promoting sustainable living through community connections.

<!-- dash-content-start -->

## 🌍 Features

- **Multilingual Support**: Available in German, English, Italian, Spanish, and French
- **Local Resource Discovery**: Find organic farms, local products, and sustainable goods
- **Water Source Locator**: Discover potable water sources and vending machines
- **Community Focus**: Non-profit initiative supporting local producers
- **Modern Tech Stack**: Built with React, Vite, Hono, and Tailwind CSS
- **Edge Deployment**: Powered by Cloudflare Workers for global performance

### 🛠️ Tech Stack

- [**React 19**](https://react.dev/) - Modern UI library with latest features
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
- [**Tailwind CSS**](https://tailwindcss.com/) - Utility-first CSS framework
- [**TypeScript**](https://www.typescriptlang.org/) - Type-safe development
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform

### ✨ Current Implementation

- 🎨 Clean, responsive landing page with multilingual support
- 🔄 Interactive components with smooth transitions
- 🌐 Language switcher for 5 supported languages
- 📱 Mobile-first responsive design
- ⚡ Optimized for Cloudflare Workers deployment

<!-- dash-content-end -->

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lujendo/kisigua.git
   cd kisigua
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Development Commands

```bash
npm run dev                # Start development server
npm run build             # Build for production
npm run preview           # Preview production build
npm run check             # Type check and dry-run deployment
npm run deploy            # Deploy to Cloudflare Workers (development)
npm run deploy:production # Deploy to production (kisura.com)
npm run deploy:staging    # Deploy to staging environment
npm run logs              # View real-time logs
npm run logs:production   # View production logs
```

## 🌐 Deployment

### Quick Deploy to Cloudflare Workers

1. **Authenticate with Cloudflare**
   ```bash
   npx wrangler auth login
   ```

2. **Deploy to development**
   ```bash
   npm run deploy
   ```

3. **Deploy to production (kisura.com)**
   ```bash
   npm run deploy:production
   ```

### Custom Domain Setup

For production deployment at **kisura.com**:

1. Configure your domain in Cloudflare
2. Update DNS settings
3. Deploy with production configuration
4. Verify SSL certificate

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Production

```bash
npm run build && npm run deploy
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
