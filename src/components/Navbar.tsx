import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Menu, X, ChevronRight, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { NavLink as StyledNavLink } from "./NavLink";
import { MetropolisLocations } from "@/data/mockLocations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, role, loading, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    (typeof MetropolisLocations)[number][]
  >([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const showSearch = !isAdminRoute;

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = MetropolisLocations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleResultClick = (id: string) => {
    navigate(`/location/${id}`);
    setSearchOpen(false);
    setSearchQuery("");
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate("/");
    setMobileMenuOpen(false);
  };

  const navLinkClass =
    "px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors";
  const navLinkActiveClass = "bg-secondary text-foreground";

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="cursor-pointer flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">NovaWatch</span>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <StyledNavLink
              to="/"
              end
              className={navLinkClass}
              activeClassName={navLinkActiveClass}
            >
              Map
            </StyledNavLink>
            <StyledNavLink
              to="/transport"
              className={navLinkClass}
              activeClassName={navLinkActiveClass}
            >
              Transport
            </StyledNavLink>
            <StyledNavLink
              to="/best-times"
              className={navLinkClass}
              activeClassName={navLinkActiveClass}
            >
              Best Times
            </StyledNavLink>
            {role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? navLinkActiveClass : ""} flex items-center gap-1.5`
                }
              >
                <Settings className="w-4 h-4" />
                Admin
              </NavLink>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {showSearch && (
              <div className="relative hidden sm:block">
                <AnimatePresence mode="wait">
                  {searchOpen ? (
                    <motion.div
                      key="search-input"
                      initial={{ width: 44, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 44, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search locations..."
                        className="h-10 pl-9 pr-9 bg-secondary border-0 rounded-full text-sm"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!searchQuery) setSearchOpen(false);
                          }, 200);
                        }}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {searchQuery.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                        >
                          {searchResults.length > 0 ? (
                            searchResults.map((result) => (
                              <button
                                key={result.id}
                                className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-center justify-between"
                                onClick={() => handleResultClick(result.id)}
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {result.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {result.address}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                              No results found
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.button
                      key="search-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                      onClick={() => setSearchOpen(true)}
                    >
                      <Search className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user.photoURL ?? undefined}
                            alt={user.displayName ?? "User"}
                          />
                          <AvatarFallback className="bg-secondary text-sm">
                            {user.displayName?.slice(0, 2)?.toUpperCase() ??
                              user.email?.slice(0, 2)?.toUpperCase() ??
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    title="Sign in"
                    aria-label="Sign in"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </button>
                )}
              </>
            )}

            {/* Mobile Menu */}
            <button
              className="md:hidden w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden py-4 border-t border-border overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-2 px-2">
                <StyledNavLink
                  to="/"
                  end
                  className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full block"
                  activeClassName="bg-secondary text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Map
                </StyledNavLink>
                <StyledNavLink
                  to="/transport"
                  className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full block"
                  activeClassName="bg-secondary text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Transport
                </StyledNavLink>
                <StyledNavLink
                  to="/best-times"
                  className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full block"
                  activeClassName="bg-secondary text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Best Times
                </StyledNavLink>
                {role === "admin" && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 w-full transition-colors ${isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </NavLink>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
