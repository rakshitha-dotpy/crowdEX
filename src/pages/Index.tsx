import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import PublicHome from "./PublicHome";
import BestTimes from "./BestTimes";
import Transport from "./Transport";
import LocationDetail from "./LocationDetail";
import AdminPanel from "./AdminPanel";
import Auth from "./Auth";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Map, Clock, Bus } from "lucide-react";
import { NavLink } from "@/components/NavLink";

function AdminRoute() {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user || role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <AdminPanel />;
}

function MobileTabBar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-card rounded-none border-t border-border/50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-around h-16">
        <NavLink
          to="/"
          end
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
          activeClassName="text-primary"
        >
          <Map className="w-5 h-5" />
          <span className="text-xs">Map</span>
        </NavLink>
        <NavLink
          to="/transport"
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
          activeClassName="text-primary"
        >
          <Bus className="w-5 h-5" />
          <span className="text-xs">Transport</span>
        </NavLink>
        <NavLink
          to="/best-times"
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
          activeClassName="text-primary"
        >
          <Clock className="w-5 h-5" />
          <span className="text-xs">Best Times</span>
        </NavLink>
      </div>
    </motion.nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname === "/auth";

  if (isAuthRoute) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Routes location={location}>
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnimatePresence mode="wait">
        {isAdminRoute ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Routes location={location}>
              <Route path="/admin/*" element={<AdminRoute />} />
            </Routes>
          </motion.div>
        ) : (
          <motion.div
            key="public"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-16 lg:pb-0"
          >
            <Routes location={location}>
              <Route path="/" element={<PublicHome />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/best-times" element={<BestTimes />} />
              <Route path="/location/:id" element={<LocationDetail />} />
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
      <MobileTabBar />
    </div>
  );
}

export default function Index() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  return <AppContent />;
}
