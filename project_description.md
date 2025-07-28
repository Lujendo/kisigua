Web Application Development Description
Overview
Build a multilingual web application serving as a search engine for essential goods, organic farms, local products (food and crafts), vending machines for local produce (like those used in Germany), and potable water sources. The platform must support German, English, Italian, Spanish, and French from launch. It requires a robust authentication system, a sophisticated admin dashboard, and a dedicated legal section for privacy policies and terms of service. The design must use Tailwind V3, prioritizing a minimal, professional, and elegant aesthetic with simple, user-friendly solutions. The application is non-profit but includes monetization via four user roles, aligned with Stripe product tiers. The tech stack uses Vite, Hono, and React, hosted on Cloudflare with Wrangler and Workers, with a Git repository linked for deployment.
Key Features

Multilingual Support:

Implement i18n for German, English, Italian, Spanish, and French.
Enable language switching and localize all user-facing content, including legal pages.


Authentication System:

Support four roles: Admin, User, Premium, and Supporter (or suggest an alternative, e.g., "Contributor").
Implement role-based access control (RBAC) for dashboard and listing permissions.
Ensure secure authentication with JWT or similar.


Item Listing and Search:

Allow users to create, edit, and delete listings for organic produce, crafts, vending machines, and water sources.
Implement detailed categorization (e.g., by product type, location, organic certification).
Build a search engine with filters (location, category, etc.) and full-text search, designed for simplicity and user-friendliness.


Admin Dashboard:

Develop a comprehensive dashboard for Admins to manage users, listings, categories, and analytics.
Include moderation tools for reviewing user-submitted items, with a clean and minimal UI.


Stripe Integration:

Integrate Stripe.js for secure payments for Premium and Supporter tiers.
Support subscription management with a seamless user experience.


Legal Section:

Create a dedicated section for legal content (privacy policies, terms of service, etc.).
Ensure content is translated into all supported languages and accessible via the footer.


Header and Footer:

Implement a consistent header with navigation (e.g., Home, Search, Dashboard, Language Switcher).
Include a footer with links to the legal section, contact information, and about page.
Design both with a minimal, professional, and elegant aesthetic using Tailwind V3.


Database and API:

Use a database (e.g., Cloudflare D1) for storing users, listings, categories, and legal content.
Build RESTful APIs with Hono for CRUD operations and search functionality.


Frontend:

Use React with Vite for a responsive, component-based UI.
Create reusable components for listings, search filters, admin dashboard, header, footer, and legal pages.
Use Tailwind V3 for styling, ensuring a minimal, professional, and elegant design with user-friendly interfaces.


Geolocation:

Include geolocation features for mapping item locations and water sources.
Consider integrating a lightweight map library like Leaflet with a clean, intuitive UI.


Non-Profit Focus:

Emphasize community and sustainability in design and messaging.
Include clear CTAs for Supporter contributions, presented elegantly and accessibly.



Development Guidelines

Set up the project structure for Vite, Hono, and React.
Define the database schema for users, listings, categories, and legal content.
Create API endpoints with Hono for CRUD and search functionality.
Build the React frontend with i18n support and reusable components.
Use Tailwind V3 for styling, focusing on a minimal, professional, and elegant aesthetic with user-friendly designs.
Implement a consistent header and footer across all pages, with a legal section accessible via the footer.
Optimize all components for Cloudflare Workers deployment.
Suggest a name for the fourth role (e.g., "Supporter" or "Contributor").
Propose additional features to enhance usability, accessibility, or community engagement.
