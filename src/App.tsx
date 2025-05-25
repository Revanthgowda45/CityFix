import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReportProvider } from "@/contexts/ReportContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from 'react-error-boundary';
import { Loading } from "@/components/ui/loading";
import { initializeUsageTracking } from "@/lib/userActivity";
import { initAuthPersistence } from "@/lib/authPersistence";
import ProtectedRoute from "@/components/ProtectedRoute";

// Initialize usage tracking on app startup
// This runs immediately when this file is imported
initializeUsageTracking();

// Initialize auth persistence to ensure session survives page reloads
initAuthPersistence().then(user => {
  if (user) {
    console.log('Auth persistence initialized with user:', user.email);
  } else {
    console.log('No user session found during auth persistence initialization');
  }
}).catch(err => {
  console.error('Error during auth persistence initialization:', err);
});

// Use React.lazy for code splitting to improve initial load time
// Only the Layout and Index components are loaded immediately
import Layout from "./components/Layout";
import Index from "./pages/Index";

// Lazy load all other pages to reduce initial bundle size
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const ViewIssue = lazy(() => import("./pages/ViewIssue"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MapView = lazy(() => import("./pages/MapView"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Create a suspense fallback that's lighter than the full authentication loading screen
const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-[70vh]">
    <Loading text="Loading page..." />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Add staleTime to reduce unnecessary refetches
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <pre className="text-sm text-muted-foreground">{error.message}</pre>
        <button
          className="mt-4 px-4 py-2 bg-urban-600 text-white rounded-md hover:bg-urban-700"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ThemeProvider defaultTheme="system" storageKey="urban-reporter-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ReportProvider>
            <SettingsProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    {/* Index page is not lazy-loaded for faster initial render */}
                    <Route index element={<Index />} />
                    
                    {/* Public routes - redirect to dashboard if already authenticated */}
                    <Route path="login" element={
                      <ProtectedRoute requireAuth={false}>
                        <Suspense fallback={<PageLoader />}>
                          <Login />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="register" element={
                      <ProtectedRoute requireAuth={false}>
                        <Suspense fallback={<PageLoader />}>
                          <Register />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="forgot-password" element={
                      <ProtectedRoute requireAuth={false}>
                        <Suspense fallback={<PageLoader />}>
                          <ForgotPassword />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="reset-password" element={
                      <ProtectedRoute requireAuth={false}>
                        <Suspense fallback={<PageLoader />}>
                          <ResetPassword />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    {/* Protected routes - require authentication */}
                    <Route path="dashboard" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                          <Dashboard />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="report" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                          <ReportIssue />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="issue/:id" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                          <ViewIssue />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="map" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                          <MapView />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="profile" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                          <Profile />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="settings" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                          <Settings />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin-only routes */}
                    <Route path="admin" element={
                      <ProtectedRoute requireAdmin={true}>
                        <Suspense fallback={<PageLoader />}>
                          <AdminDashboard />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={
                      <Suspense fallback={<PageLoader />}>
                        <NotFound />
                      </Suspense>
                    } />
                  </Route>
                </Routes>
                </BrowserRouter>
                </TooltipProvider>
              </NotificationProvider>
            </SettingsProvider>
          </ReportProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
