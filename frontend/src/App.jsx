import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VerificationUpload from './pages/VerificationUpload.jsx';
import BrowseListings from './pages/BrowseListings.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import CreateEditListing from './pages/CreateEditListing.jsx';
import WishlistBoard from './pages/WishlistBoard.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TransactionDetail from './pages/TransactionDetail.jsx';
import UserProfile from './pages/UserProfile.jsx';
import SafetyGuidelines from './pages/SafetyGuidelines.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminVerificationQueue from './pages/admin/AdminVerificationQueue.jsx';
import AdminReportsQueue from './pages/admin/AdminReportsQueue.jsx';
import AdminUserManagement from './pages/admin/AdminUserManagement.jsx';
import AdminStatsDashboard from './pages/admin/AdminStatsDashboard.jsx';

export default function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen flex flex-col bg-paper text-ink font-body">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse" element={<BrowseListings />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/safety" element={<SafetyGuidelines />} />
            <Route path="/profile/:id?" element={<UserProfile />} />

            <Route path="/verify" element={<ProtectedRoute><VerificationUpload /></ProtectedRoute>} />
            <Route path="/create-listing" element={<ProtectedRoute><CreateEditListing /></ProtectedRoute>} />
            <Route path="/listings/:id/edit" element={<ProtectedRoute><CreateEditListing /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><WishlistBoard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/transactions/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />

            <Route path="/admin/verifications" element={<ProtectedRoute roles={['admin']}><AdminVerificationQueue /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReportsQueue /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUserManagement /></ProtectedRoute>} />
            <Route path="/admin/stats" element={<ProtectedRoute roles={['admin']}><AdminStatsDashboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="border-t border-ink/10 py-6 text-center text-xs text-muted">
          ShareShelf — a discovery &amp; matching layer only. Payment, delivery, and item condition are arranged and confirmed by users in person.
        </footer>
      </div>
    </SocketProvider>
  );
}
