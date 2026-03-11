import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SiteSettingsProvider, useSiteSettings } from './contexts/SiteSettingsContext';
import { SiteContentProvider } from './contexts/SiteContentContext';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import AnalyticsTracker from './components/AnalyticsTracker';
import ScrollToTop from './components/ScrollToTop';

const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const GalleryDetailPage = lazy(() => import('./pages/GalleryDetailPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TryInMyRoomPage = lazy(() => import('./pages/TryInMyRoomPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminGalleryPage = lazy(() => import('./pages/AdminGalleryPage'));
const AdminGalleryAddPage = lazy(() => import('./pages/AdminGalleryAddPage'));
const AdminGalleryEditPage = lazy(() => import('./pages/AdminGalleryEditPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminMessagesPage = lazy(() => import('./pages/AdminMessagesPage'));
const AdminReviewsPage = lazy(() => import('./pages/AdminReviewsPage'));
const AdminContentPage = lazy(() => import('./pages/AdminContentPage'));

const PageLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function AppRoutes() {
  const { features } = useSiteSettings();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      <AnalyticsTracker />
      {!isAdminArea && <FloatingButtons />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <HomePage />
            </main>
            <Footer />
          </div>
        } />
        <Route path="/galerie" element={
          <div className="flex flex-col min-h-screen bg-neutral-50">
            <Header />
            <main className="flex-grow min-h-screen">
              <Suspense fallback={<PageLoader />}><GalleryPage /></Suspense>
            </main>
            <Footer />
          </div>
        } />
        <Route path="/galerie/:id" element={
          <div className="flex flex-col min-h-screen bg-neutral-50">
            <Header />
            <main className="flex-grow min-h-screen">
              <Suspense fallback={<PageLoader />}><GalleryDetailPage /></Suspense>
            </main>
            <Footer />
          </div>
        } />
        {/* Legacy/SEO-friendly alias for gallery */}
        <Route path="/mobilier/dressinguri-si-dulapuri" element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}><GalleryPage /></Suspense>
            </main>
            <Footer />
          </div>
        } />
        <Route path="/produs/:id" element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>
            </main>
            <Footer />
          </div>
        } />
        <Route path="/despre" element={
          <div className="flex flex-col min-h-screen overflow-x-hidden">
            <Header />
            <main className="flex-grow overflow-x-hidden">
              <Suspense fallback={<PageLoader />}><AboutPage /></Suspense>
            </main>
            <Footer />
          </div>
        } />
        <Route path="/contact" element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}><ContactPage /></Suspense>
            </main>
            <Footer />
          </div>
        } />
        <Route path="/try-room" element={
          features.tryInMyRoomEnabled ? (
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<PageLoader />}><TryInMyRoomPage /></Suspense>
              </main>
              <Footer />
            </div>
          ) : (
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <HomePage />
              </main>
              <Footer />
            </div>
          )
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
          <Route path="gallery" element={<Suspense fallback={<PageLoader />}><AdminGalleryPage /></Suspense>} />
          <Route path="gallery/new" element={<Suspense fallback={<PageLoader />}><AdminGalleryAddPage /></Suspense>} />
          <Route path="gallery/edit/:id" element={<Suspense fallback={<PageLoader />}><AdminGalleryEditPage /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AdminAnalyticsPage /></Suspense>} />
          <Route path="content" element={<Suspense fallback={<PageLoader />}><AdminContentPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
          <Route path="messages" element={<Suspense fallback={<PageLoader />}><AdminMessagesPage /></Suspense>} />
          <Route path="reviews" element={<Suspense fallback={<PageLoader />}><AdminReviewsPage /></Suspense>} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SiteContentProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <SiteSettingsProvider>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </SiteSettingsProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </SiteContentProvider>
    </Router>
  );
}

export default App;
