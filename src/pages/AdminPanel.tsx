import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MapPin, Video, Upload, BarChart3, Settings, ChevronLeft, Globe, Users, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminDashboard from './admin/AdminDashboard';
import AdminLocations from './admin/AdminLocations';
import AdminCameras from './admin/AdminCameras';
import AdminLiveCCTV from './admin/AdminLiveCCTV';
import AdminVideoUpload from './admin/AdminVideoUpload';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminSettings from './admin/AdminSettings';
import AdminUsers from './admin/AdminUsers';

export type AdminPage = 'dashboard' | 'locations' | 'cameras' | 'live-cctv' | 'upload' | 'analytics' | 'users' | 'settings';

const navItems: { id: AdminPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'cameras', label: 'Local Camera', icon: Video },
  { id: 'live-cctv', label: 'Live CCTV', icon: Globe },
  { id: 'upload', label: 'Video Upload', icon: Upload },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPanel() {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <AdminDashboard onNavigate={setActivePage} />;
      case 'locations': return <AdminLocations />;
      case 'cameras': return <AdminCameras />;
      case 'live-cctv': return <AdminLiveCCTV />;
      case 'upload': return <AdminVideoUpload />;
      case 'analytics': return <AdminAnalytics />;
      case 'users': return <AdminUsers />;
      case 'settings': return <AdminSettings />;
      default: return <AdminDashboard onNavigate={setActivePage} />;
    }
  };

  const handleNavClick = (id: AdminPage) => {
    setActivePage(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pt-14 flex">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-16 left-4 z-50 bg-card border border-border rounded-lg p-2 shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <motion.aside
        className={cn(
          "hidden lg:flex fixed left-0 top-14 bottom-0 z-40 bg-card border-r border-border flex-col",
          sidebarCollapsed ? "w-16" : "w-56"
        )}
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 224 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex-1 py-4 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                activePage === item.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            className="lg:hidden fixed left-0 top-14 bottom-0 z-50 w-64 bg-card border-r border-border flex flex-col"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex-1 py-4 px-2 pt-12">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                    activePage === item.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                  onClick={() => handleNavClick(item.id)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200",
        "lg:ml-56",
        sidebarCollapsed && "lg:ml-16",
        "ml-0"
      )}>
        <motion.div
          key={activePage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="p-4 sm:p-6"
        >
          {renderPage()}
        </motion.div>
      </main>
    </div>
  );
}
