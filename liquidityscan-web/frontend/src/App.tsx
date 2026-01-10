import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import MainLayout from './components/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnimatedPage } from './components/animations/AnimatedPage';
import { OAuthHandler } from './components/OAuthHandler';
import './index.css';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const MonitorSuperEngulfing = lazy(() => import('./pages/MonitorSuperEngulfing').then(m => ({ default: m.MonitorSuperEngulfing })));
const MonitorBias = lazy(() => import('./pages/MonitorBias').then(m => ({ default: m.MonitorBias })));
const MonitorRSI = lazy(() => import('./pages/MonitorRSI').then(m => ({ default: m.MonitorRSI })));
const SignalDetails = lazy(() => import('./pages/SignalDetails').then(m => ({ default: m.SignalDetails })));
const StrategiesDashboard = lazy(() => import('./pages/StrategiesDashboard').then(m => ({ default: m.StrategiesDashboard })));
const StrategyDetail = lazy(() => import('./pages/StrategyDetail').then(m => ({ default: m.StrategyDetail })));
const ToolsDashboard = lazy(() => import('./pages/ToolsDashboard').then(m => ({ default: m.ToolsDashboard })));
const Academy = lazy(() => import('./pages/Academy').then(m => ({ default: m.Academy })));
const CourseDetail = lazy(() => import('./pages/CourseDetail').then(m => ({ default: m.CourseDetail })));
const LessonView = lazy(() => import('./pages/LessonView').then(m => ({ default: m.LessonView })));

// Admin Pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement').then(m => ({ default: m.UsersManagement })));
const CoursesManagement = lazy(() => import('./pages/admin/CoursesManagement').then(m => ({ default: m.CoursesManagement })));
const SignalsManagement = lazy(() => import('./pages/admin/SignalsManagement').then(m => ({ default: m.SignalsManagement })));
const Analytics = lazy(() => import('./pages/admin/Analytics').then(m => ({ default: m.Analytics })));
const ContentManagement = lazy(() => import('./pages/admin/ContentManagement').then(m => ({ default: m.ContentManagement })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const CourseEditor = lazy(() => import('./pages/admin/CourseEditor').then(m => ({ default: m.CourseEditor })));
const DailyRecap = lazy(() => import('./pages/DailyRecap').then(m => ({ default: m.DailyRecap })));
const RiskCalculator = lazy(() => import('./pages/RiskCalculator').then(m => ({ default: m.RiskCalculator })));
const SuperEngulfing = lazy(() => import('./pages/SuperEngulfing').then(m => ({ default: m.SuperEngulfing })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Support = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const Subscription = lazy(() => import('./pages/Subscription').then(m => ({ default: m.Subscription })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full bg-background-dark">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <div className="text-white text-lg">Loading...</div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const location = useLocation();
  
  return (
    <>
      <OAuthHandler />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
          
          {/* Redirect /app to dashboard */}
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          <Route path="/app/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/app/dashboard" element={<Navigate to="/dashboard" replace />} />
          
          {/* Protected Routes */}
          <Route element={<MainLayout />}>
            <Route path="dashboard" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="monitor/superengulfing" element={<AnimatedPage><MonitorSuperEngulfing /></AnimatedPage>} />
            <Route path="monitor/bias" element={<AnimatedPage><MonitorBias /></AnimatedPage>} />
            <Route path="monitor/rsi" element={<AnimatedPage><MonitorRSI /></AnimatedPage>} />
            <Route path="signals/:id" element={<AnimatedPage><SignalDetails /></AnimatedPage>} />
            <Route path="strategies" element={<AnimatedPage><StrategiesDashboard /></AnimatedPage>} />
            <Route path="strategies/:id" element={<AnimatedPage><StrategyDetail /></AnimatedPage>} />
            <Route path="tools" element={<AnimatedPage><ToolsDashboard /></AnimatedPage>} />
            <Route path="academy" element={<AnimatedPage><Academy /></AnimatedPage>} />
            <Route path="academy/course/:courseId" element={<AnimatedPage><CourseDetail /></AnimatedPage>} />
            <Route path="academy/course/:courseId/lesson/:lessonId" element={<AnimatedPage><LessonView /></AnimatedPage>} />
            <Route path="daily-recap" element={<AnimatedPage><DailyRecap /></AnimatedPage>} />
            <Route path="risk-calculator" element={<AnimatedPage><RiskCalculator /></AnimatedPage>} />
            <Route path="superengulfing" element={<SuperEngulfing />} />
            <Route path="settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
            <Route path="support" element={<AnimatedPage><Support /></AnimatedPage>} />
            <Route path="subscription" element={<AnimatedPage><Subscription /></AnimatedPage>} />
            <Route path="profile" element={<AnimatedPage><Profile /></AnimatedPage>} />
          </Route>

          {/* Admin Routes */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="courses" element={<CoursesManagement />} />
            <Route path="courses/:courseId" element={<CourseEditor />} />
            <Route path="signals" element={<SignalsManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
