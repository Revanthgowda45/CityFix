<div align="center">
  <img src="public/cityfix-icon.svg" alt="CityFix Logo" width="120" height="120">
  <h1>CityFix</h1>
  <p><strong>Empowering citizens to improve urban environments</strong></p>
</div>

<p align="center">
  <a href="#frontend">Frontend</a> •
  <a href="#backend">Backend</a>
</p>

<p align="center">
  <strong>🔗 <a href="https://finecityfix.netlify.app/" target="_blank">Live Demo</a></strong>
</p>

---

CityFix is a comprehensive civic engagement platform that empowers citizens to report and track urban issues in their communities. From potholes and broken streetlights to garbage collection problems and public safety concerns, CityFix provides a streamlined interface for citizens to communicate with local authorities and see real results.

## Frontend

### Core Technologies
- **Language**: TypeScript 5.5 - Strong type safety throughout the application
- **Framework**: React 18.3 - Latest React features including concurrent rendering
- **Build Tool**: Vite 5.4 - Lightning-fast HMR and optimized production builds

### Architecture
- **Component Structure**: Modular component-based architecture with context separation
- **Code Splitting**: React.lazy and Suspense for optimized loading
- **Error Handling**: React Error Boundary for graceful error management
- **Routing**: React Router v6 with protected routes for authentication

### State Management
- **Global State**: React Context API with specialized contexts:
  - `AuthContext`: User authentication and permissions
  - `ReportContext`: Issue reporting and management
  - `SettingsContext`: User preferences and application settings
  - `NotificationContext`: User notifications and alerts
- **Server State**: TanStack Query (React Query 5) for efficient data fetching, caching, and synchronization
- **Form State**: React Hook Form 7 with Zod validation schema for robust form handling

### UI & Styling
- **Component Library**: shadcn/ui built on Radix UI primitives
- **CSS Framework**: Tailwind CSS 3.4 with utility-first styling
- **Theming**: Dynamic theme support with light/dark mode switching
- **Animations**: Framer Motion for fluid, high-performance animations
- **Notifications**: Toast and notification systems for user feedback

### Maps & Geolocation
- **Mapping Library**: Leaflet 1.9 with React-Leaflet components
- **Base Maps**: OpenStreetMap for detailed, community-maintained cartography
- **Geolocation**: Browser Geolocation API integration
- **Custom Features**: Location picking, issue clustering, and map filtering

## Backend

### Supabase Integration

#### Authentication & User Management
- **Auth Flow**: Complete authentication system with email/password login
- **Session Handling**: Persistent sessions with automatic token refresh
- **User Roles**: Role-based authorization (citizen, staff, admin)
- **Profile Management**: User profile data with avatar storage
- **Security**: Password reset, email verification, and session monitoring

#### Database Architecture
- **PostgreSQL Database**: Relational database with structured schema
- **Row-Level Security**: Policy-based access control for data protection
- **Core Tables**:
  - `issues`: Urban issues with location, status, and category
  - `profiles`: User information including roles and preferences
  - `issue_comments`: Community discussion on reported issues
  - `votes`: Community support tracking for prioritization

#### API Layer
- **Data Services**: Abstracted client for consistent data access
- **Query Optimization**: Efficient queries with selected fields
- **Error Handling**: Comprehensive error management and recovery
- **State Synchronization**: Consistent data state between client and server

#### Storage Solution
- **Image Management**: Storage for issue photos and user avatars
- **Upload Pipeline**: Secure, optimized image upload workflow
- **Transformations**: Image processing for different display contexts
- **Delivery**: Fast CDN-backed content delivery

#### Real-time Capabilities
- **Live Updates**: Instant UI updates through subscriptions
- **Channels**: Dedicated real-time channels for different data types
- **Filtered Subscriptions**: Targeted updates for specific data changes
- **Resilient Connection**: Graceful handling of connection issues

<p align="center">Made with ❤️ for better communities</p>
