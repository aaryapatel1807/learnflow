import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Navigation, Menu, ChevronDown } from "lucide-react";
import { isAuthenticated, getUser, logout } from "../utils/auth";
import "./AnimatedNav.css";

const primaryItems = [
  { name: "Dashboard", href: "/" },
  { name: "Catalogue", href: "/catalogue" },
  { name: "Paths", href: "/learning-paths" },
  { name: "Roadmaps", href: "/roadmaps" },
  { name: "Quizzes", href: "/quizzes" },
];

const moreItems = [
  { name: "Flashcards", href: "/flashcards" },
  { name: "Notes", href: "/notes" },
  { name: "Bookmarks", href: "/bookmarks" },
  { name: "Achievements", href: "/achievements" },
];

const EXPAND_SCROLL_THRESHOLD = 80;

const containerVariants = {
  expanded: {
    y: 0,
    opacity: 1,
    width: "auto",
    transition: {
      y: { type: "spring", damping: 18, stiffness: 250 },
      opacity: { duration: 0.3 },
      type: "spring",
      damping: 20,
      stiffness: 300,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
  collapsed: {
    y: 0,
    opacity: 1,
    width: "3rem",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const logoVariants = {
  expanded: { opacity: 1, x: 0, rotate: 0, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -25, rotate: -180, transition: { duration: 0.3 } },
};

const itemVariants = {
  expanded: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
};

const collapsedIconVariants = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  collapsed: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 15, stiffness: 300, delay: 0.15 },
  },
};

export function AnimatedNav({ onLogout }) {
  const [isExpanded, setExpanded] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const moreRef = useRef(null);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const scrollPositionOnCollapse = useRef(0);

  // Sync dark mode with html attribute
  useEffect(() => {
    const stored = localStorage.getItem("learnflow-theme");
    if (stored === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = (e) => {
    e.stopPropagation();
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("learnflow-theme", next ? "dark" : "light");
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (isExpanded && latest > previous && latest > 150) {
      setExpanded(false);
      setMoreOpen(false);
      setProfileOpen(false);
      scrollPositionOnCollapse.current = latest;
    } else if (
      !isExpanded &&
      latest < previous &&
      scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD
    ) {
      setExpanded(true);
    }
    lastScrollY.current = latest;
  });

  const handleNavClick = (e) => {
    if (!isExpanded) {
      e.preventDefault();
      setExpanded(true);
    }
  };

  const user = isAuthenticated() ? getUser() : null;
  const level = user ? Math.floor((user.xp || 0) / 100) + 1 : null;
  // Extra links live under "More"; the Admin link only shows for admin users
  const dropdownItems =
    user && user.role === "admin"
      ? [...moreItems, { name: "Admin", href: "/admin" }]
      : moreItems;

  const isActiveHref = (href) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);
  const isMoreActive = dropdownItems.some((item) => isActiveHref(item.href));

  // Close the dropdowns on navigation or outside click
  useEffect(() => {
    setMoreOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [moreOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onPointerDown = (e) => {
      const inTrigger =
        profileRef.current && profileRef.current.contains(e.target);
      const inPanel =
        e.target.closest && e.target.closest(".nav-profile-panel");
      if (!inTrigger && !inPanel) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <div className="animated-nav-container" ref={moreRef}>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={containerVariants}
        whileHover={!isExpanded ? { scale: 1.1 } : {}}
        whileTap={!isExpanded ? { scale: 0.95 } : {}}
        onClick={handleNavClick}
        className={`animated-nav ${!isExpanded ? "collapsed" : ""}`}
      >
        {/* Brand logo */}
        <motion.div variants={logoVariants} className="nav-logo">
          <Navigation className="nav-icon" />
        </motion.div>

        {/* Nav links */}
        <motion.div className={`nav-items ${!isExpanded ? "pointer-none" : ""}`}>
          {primaryItems.map((item) => {
            const isActive = isActiveHref(item.href);
            return (
              <motion.div key={item.name} variants={itemVariants}>
                <Link
                  to={item.href}
                  onClick={(e) => e.stopPropagation()}
                  className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                >
                  {item.name}
                  {isActive && <span className="nav-active-dot" />}
                </Link>
              </motion.div>
            );
          })}

          {/* More dropdown trigger */}
          <motion.div variants={itemVariants} className="nav-more">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMoreOpen((open) => !open);
                setProfileOpen(false);
              }}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              className={`nav-link nav-more-btn ${moreOpen ? "open" : ""} ${
                isMoreActive ? "nav-link-active" : ""
              }`}
            >
              <span className="nav-more-label">
                More
                <ChevronDown className="nav-chevron" size={13} />
              </span>
              {isMoreActive && <span className="nav-active-dot" />}
            </button>
          </motion.div>

          {/* Right side: auth actions when logged out, profile avatar when logged in */}
          <motion.div variants={itemVariants} className="nav-right">
            {user ? (
              <div className="nav-profile" ref={profileRef}>
                <button
                  type="button"
                  className="nav-avatar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen((open) => !open);
                    setMoreOpen(false);
                  }}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  title={user.name || "Profile"}
                >
                  {(user.name || "U").charAt(0).toUpperCase()}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={(e) => e.stopPropagation()}
                  className={`nav-link ${isActiveHref("/login") ? "nav-link-active" : ""}`}
                >
                  Login
                  {isActiveHref("/login") && <span className="nav-active-dot" />}
                </Link>
                <Link
                  to="/register"
                  onClick={(e) => e.stopPropagation()}
                  className="nav-auth-btn"
                >
                  Register
                </Link>
              </>
            )}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </motion.div>
        </motion.div>

        {/* Collapsed icon */}
        <div className="collapsed-icon-container">
          <motion.div
            variants={collapsedIconVariants}
            animate={isExpanded ? "expanded" : "collapsed"}
          >
            <Menu className="nav-icon" />
          </motion.div>
        </div>
      </motion.nav>

      {/* More dropdown — rendered outside the pill so it is never clipped */}
      {moreOpen && isExpanded && (
        <motion.div
          className="nav-dropdown-panel"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18 }}
        >
          {dropdownItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-dropdown-link ${
                isActiveHref(item.href) ? "nav-dropdown-link-active" : ""
              }`}
            >
              {item.name}
            </Link>
          ))}
        </motion.div>
      )}

      {/* Profile menu — avatar card with logout */}
      {profileOpen && isExpanded && user && (
        <motion.div
          className="nav-dropdown-panel nav-profile-panel"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18 }}
        >
          <div className="nav-profile-head">
            <span className="nav-avatar nav-avatar-lg">
              {(user.name || "U").charAt(0).toUpperCase()}
            </span>
            <span className="nav-profile-meta">
              <span className="nav-profile-name">{user.name}</span>
              <span className="nav-profile-sub">
                Lv {level} · {user.xp || 0} XP
              </span>
            </span>
          </div>
          <span className="nav-dropdown-sep" />
          <button
            type="button"
            className="nav-dropdown-link nav-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </motion.div>
      )}
    </div>
  );
}
