import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayouts";
import ProtectedRoute from "./components/ProtectedRoute";

// Import your pages
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import BrandProfilePage from "./pages/BrandProfile";
import InfluencerProfile from "./pages/InfluencerProfile";
import PublicBrandProfilePage from "./pages/PublicBrandProfile";
import DashboardPage from "./pages/Dashboard";
import BrandDashboard from "./pages/BrandDashboard";
import InfluencerDashboard from "./pages/InfluencerDashboard";
import SearchPage from "./pages/SearchPage";
import InfluencerPage from "./pages/InfluencerPage";
import SponsorshipsPage from "./pages/SponsorshipsPage";
import CreateSponsorshipPage from "./pages/CreateSponsorship";
import AnalyticsPage from "./pages/AnalyticsPage";
import MessagesPage from "./pages/MessagesPage";
import NotFoundPage from "./pages/NotFound";
import SettingsPage from "./pages/Settings";
import SponsorshipDetailPage from "./pages/SponsorshipDetailPage";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import BlogPage from "./pages/Blog";
import CareersPage from "./pages/Careers";
import PricingPage from "./pages/Pricing";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import CookiesPage from "./pages/Cookies";
import ForBrandsPage from "./pages/ForBrands";
import ForInfluencersPage from "./pages/ForInfluencers";
import ContactBrandPage from "./pages/ContactBrandPage";

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Role-specific profile routes with protection */}
          <Route 
            path="/brand-profile" 
            element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/influencer-profile" 
            element={
              <ProtectedRoute allowedRoles={['influencer']}>
                <InfluencerProfile />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/brand/:brandId" element={<PublicBrandProfilePage />} />
          
          {/* Role-specific dashboards with protection */}
          <Route 
            path="/brand/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/influencer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['influencer']}>
                <InfluencerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Keep the old dashboard route for backward compatibility, but redirect */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route path="/search" element={<SearchPage />} />
          <Route path="/influencer/:handle" element={<InfluencerPage />} />
          <Route
            path="/sponsorships"
            element={
              <ProtectedRoute allowedRoles={["brand", "influencer"]}>
                <SponsorshipsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sponsorships/create"
            element={
              <ProtectedRoute allowedRoles={["brand"]}>
                <CreateSponsorshipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sponsorships/:id"
            element={
              <ProtectedRoute allowedRoles={["brand", "influencer"]}>
                <SponsorshipDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["brand", "influencer"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedRoles={["brand", "influencer"]}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["brand", "influencer"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact-brand/:id"
            element={
              <ProtectedRoute allowedRoles={["influencer"]}>
                <ContactBrandPage />
              </ProtectedRoute>
            }
          />
          <Route path="/brands" element={<ForBrandsPage />} />
          <Route path="/influencers" element={<ForInfluencersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
