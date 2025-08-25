<div align="center">
  <img src="public/cityfix-icon.svg" alt="CityFix Logo" width="120" height="120">
  <h1>CityFix</h1>
  <p><strong>Empowering citizens to improve urban environments</strong></p>
</div>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <strong>🔗 <a href="https://finecityfix.netlify.app/" target="_blank">Live Demo</a></strong>
</p>

---

## 📋 Overview

CityFix is a comprehensive civic engagement platform that empowers citizens to report and track urban issues in their communities. From potholes and broken streetlights to garbage collection problems and public safety concerns, CityFix provides a streamlined interface for citizens to communicate with local authorities and see real results.

## ✨ Features

### 🔐 User Authentication
- **Secure Account Management**: Register, login, and manage your profile
- **Password Recovery**: Reset forgotten passwords via email
- **Role-Based Access Control**: Different capabilities for citizens, municipal staff, and administrators

### 📝 Issue Reporting
- **Intuitive Report Creation**: Easy-to-use form for reporting civic issues
- **Photo Upload**: Attach images to provide visual context for reported issues
- **Location Selection**: Pin exact locations using interactive maps (Leaflet/OpenStreetMap integration)
- **Category Classification**: Organize issues by type (infrastructure, sanitation, safety, etc.)

### 🗺️ Interactive Map
- **Geospatial Visualization**: View all reported issues on an interactive map
- **Filtering Options**: Filter issues by status, category, or date
- **Clustering**: Group nearby issues for cleaner visualization in dense areas

### 📊 Dashboard & Tracking
- **User Dashboard**: Monitor your reported issues and their resolution status
- **Admin Dashboard**: Comprehensive overview for municipal authorities
- **Analytics**: Track resolution times, common issue types, and problem hotspots

### 📱 Responsive Design
- **Mobile-Friendly Interface**: Optimal experience across devices
- **Progressive Web App Capabilities**: Install on home screen for app-like experience

### 👥 Community Features
- **Issue Updates**: Receive notifications on status changes
- **User Profiles**: Build reputation through active participation

## 🛠️ Tech Stack

### Core Technologies
- **Language**: TypeScript 5.5 - Providing strong type safety throughout the application
- **Framework**: React 18.3 - Leveraging the latest React features including concurrent rendering
- **Build Tool**: Vite 5.4 - Offering lightning-fast HMR and optimized production builds
- **Package Manager**: npm - Managing project dependencies with lockfile for consistent installations

### Frontend Architecture
- **Component Structure**: Modular component-based architecture with context separation
- **Code Splitting**: Implemented using React.lazy and Suspense for optimized loading
- **Error Handling**: React Error Boundary for graceful error management

### State Management
- **Global State**: React Context API with specialized contexts for Auth, Reports, Settings, and Notifications
- **Server State**: TanStack Query (React Query 5) for efficient data fetching, caching, and synchronization
- **Form State**: React Hook Form 7 with Zod validation schema for robust form handling

### UI & Styling
- **Component Library**: shadcn/ui - Composable, accessible UI components built on Radix UI primitives
- **CSS Framework**: Tailwind CSS 3.4 with PostCSS for utility-first styling
- **Theming**: Dynamic theme support with next-themes (light/dark mode switching)
- **Icons**: Lucide React providing consistent, accessible SVG icons
- **Animations**: Framer Motion for fluid, high-performance animations
- **Notifications**: Sonner and Radix Toast for flexible user notifications

### Maps & Geolocation
- **Mapping Library**: Leaflet 1.9 with React-Leaflet for interactive maps
- **Base Maps**: OpenStreetMap for detailed, community-maintained cartography
- **Geolocation**: Browser Geolocation API integration for user positioning
- **Custom Map Layers**: Support for multiple map styles and overlay options

### Backend Integration (Supabase)

#### Authentication & User Management
- **Custom Auth Service**: Robust authentication service with error handling and fallback mechanisms
- **Auth Persistence**: Session management across page reloads and browser sessions
- **Registration Flow**: Two-step user creation process (auth + profile creation)
- **Role-Based Access**: Citizen, municipal staff, and administrator role management
- **Profile Management**: User profile data storage with avatar uploads

#### Database Architecture
- **PostgreSQL Database**: Leveraging Supabase's managed PostgreSQL service
- **Row-Level Security (RLS)**: Fine-grained access control policies at the row level
- **Relational Schema**: Structured data model with proper relationships between entities
  - `issues`: Core table for tracking civic problems
  - `profiles`: User profiles with roles and metadata
  - `issue_comments`: Discussion threads for each issue
  - `votes`: Tracking community support for issues

#### API Integration
- **Data Access Layer**: Abstracted Supabase client for consistent error handling
- **Query Optimization**: Efficient queries with minimal selected fields when appropriate
- **Transaction Support**: Database transactions for multi-step operations
- **Connection Resilience**: Automatic reconnection and error recovery mechanisms

#### File Storage
- **Image Management**: Secure storage for issue photos and user avatars
- **Access Control**: Proper permissions for uploaded files
- **Transformations**: Image resizing and optimization for different use cases
- **CDN Delivery**: Fast content delivery through Supabase's global CDN

#### Real-time Features
- **Live Updates**: Real-time subscriptions for immediate UI updates
- **Channels**: Dedicated channels for issue and comment changes
- **Filtered Subscriptions**: Targeted real-time updates based on specific criteria
- **Offline Handling**: Graceful degradation when real-time connection is unavailable

### Performance & Optimization
- **Lazy Loading**: Components and routes loaded on demand
- **Memoization**: Strategic use of React.memo and useMemo for performance
- **Code Splitting**: Route-based code splitting to reduce initial bundle size
- **Image Optimization**: Modern image handling with appropriate formats and sizes

### DevOps & Tooling
- **Type Checking**: TypeScript with strict mode enabled
- **Linting**: ESLint 9 with React-specific plugins
- **Deployment**: Configured for Netlify with optimized build settings
- **Environment Variables**: Structured environment configuration for different deployment scenarios

## 🚀 Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Revanthgowda45/CityFix.git
   cd cityfix
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Environment setup:**
   Create a `.env` file in the project root with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 📖 Usage

1. **Create an account** or login to your existing account
2. **Report an issue** by filling out the form and providing location details
3. **Track your reports** through your personal dashboard
4. **Explore the map** to view issues reported by other community members

## 📦 Deployment

### Build for Production

```bash
npm run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

The application supports deployment to platforms like Netlify, Vercel, or any static hosting provider.

---

<p align="center">Made with ❤️ for better communities</p>
