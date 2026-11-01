import { BrowserRouter, Routes, Route } from "react-router-dom";

// Components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// =============================
// MEMBER 1 - PUBLIC WEBSITE
// =============================
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Insights from "./pages/Insights.jsx";
import ImpactLab from "./pages/ImpactLab.jsx";
import LiveMap from "./pages/LiveMap.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

// =============================
// MEMBER 2 - DONOR
// =============================
import DonorDashboard from "./pages/DonorDashboard.jsx";
import AddFood from "./pages/AddFood.jsx";
import MyListings from "./pages/MyListings.jsx";
import DonationStatus from "./pages/DonationStatus.jsx";

// =============================
// MEMBER 3 - RECEIVER
// =============================
import ReceiverDashboard from "./pages/ReceiverDashboard.jsx";
import ReceiverRequests from "./pages/ReceiverRequests.jsx";
import ReceiverHistory from "./pages/ReceiverHistory.jsx";

// =============================
// MEMBER 4 - VOLUNTEER
// =============================
import VolunteerDashboard from "./pages/VolunteerDashboard.jsx";
import PickupSchedule from "./pages/PickupSchedule.jsx";
import DeliveryStatus from "./pages/DeliveryStatus.jsx";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";

// =============================
// CSS
// =============================
import "./styles/theme.css";
import "./App.css";
import "./styles/workspace.css";

// =============================
// PUBLIC LAYOUT
// Navbar + Footer
// =============================
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

// =============================
// AUTH LAYOUT
// Navbar only
// =============================
function AuthLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

// =============================
// DONOR + RECEIVER LAYOUT
// Page + Footer
// =============================
function DashboardLayout({ children }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}

// =============================
// APP
// =============================
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================
            MEMBER 1 - PUBLIC WEBSITE
           ================================= */}

        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route
          path="/about"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />

        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          }
        />

        <Route path="/research" element={<PublicLayout><Insights /></PublicLayout>} />

        <Route path="/impact" element={<PublicLayout><ImpactLab /></PublicLayout>} />
        <Route path="/map" element={<PublicLayout><LiveMap /></PublicLayout>} />
        <Route path="/admin" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />

        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />

        <Route
          path="/signup"
          element={
            <AuthLayout>
              <Signup />
            </AuthLayout>
          }
        />

        {/* =================================
            MEMBER 2 - DONOR
           ================================= */}

        <Route
          path="/donor"
          element={
            <DashboardLayout>
              <DonorDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/donor/add-food"
          element={
            <DashboardLayout>
              <AddFood />
            </DashboardLayout>
          }
        />

        <Route
          path="/donor/listings"
          element={
            <DashboardLayout>
              <MyListings />
            </DashboardLayout>
          }
        />

        <Route
          path="/donor/status"
          element={
            <DashboardLayout>
              <DonationStatus />
            </DashboardLayout>
          }
        />

        {/* =================================
            MEMBER 3 - RECEIVER
           ================================= */}

        <Route
          path="/receiver"
          element={
            <DashboardLayout>
              <ReceiverDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/receiver/requests"
          element={
            <DashboardLayout>
              <ReceiverRequests />
            </DashboardLayout>
          }
        />

        <Route
          path="/receiver/history"
          element={
            <DashboardLayout>
              <ReceiverHistory />
            </DashboardLayout>
          }
        />

        {/* =================================
            MEMBER 4 - VOLUNTEER
           ================================= */}

        <Route
          path="/volunteer"
          element={<VolunteerDashboard />}
        />

        <Route
          path="/volunteer/dashboard"
          element={<VolunteerDashboard />}
        />

        <Route
          path="/volunteer/pickup"
          element={<PickupSchedule />}
        />

        <Route
          path="/volunteer/delivery"
          element={<DeliveryStatus />}
        />

        <Route
          path="/volunteer/profile"
          element={<Profile />}
        />

        <Route
          path="/volunteer/notifications"
          element={<Notifications />}
        />

        <Route
          path="/volunteer/settings"
          element={<Settings />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;