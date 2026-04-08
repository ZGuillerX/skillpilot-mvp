// src/components/Navbar.jsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Efecto de scroll para cambiar el estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const primaryLinks = [
    {
      name: "Inicio",
      href: "/",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Aprender",
      href: "/onboarding",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      name: "Practicar",
      href: "/challenges",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      badge: "Pro",
    },
    {
      name: "Construir",
      href: "/custom-challenges",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
  ];

  const userMenuLinks = [
    {
      name: "Mi Perfil",
      href: "/profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      name: "Historial",
      href: "/history",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      name: "Estadisticas",
      href: "/stats",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      name: "Workspace",
      href: "/workspace-dashboard",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass shadow-lg border-b border-[var(--border)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg group-hover:shadow-[var(--shadow-glow)] transition-all duration-300 group-hover:scale-105">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight">
                  <span className="text-foreground">Skill</span>
                  <span className="text-gradient">Pilot</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-medium -mt-1 tracking-wider uppercase">
                  Learn. Code. Build.
                </span>
              </div>
            </a>

            {/* Navigation Links - Desktop */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]">
                {primaryLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      isActive(link.href)
                        ? "text-white bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-[var(--muted)]"
                    }`}
                  >
                    {link.icon}
                    {link.name}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--accent)] text-white rounded-md">
                        {link.badge}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Streak/Stats Quick View */}
                  <a
                    href="/stats"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success-bg)] border border-[var(--success)]/20 text-[var(--success)] text-sm font-semibold hover:bg-[var(--success)]/20 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span>Ver logros</span>
                  </a>

                  {/* User Menu */}
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all duration-200 ${
                        showUserMenu
                          ? "bg-[var(--muted)] border-[var(--primary)]"
                          : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-light)]"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-sm shadow-inner">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground hidden sm:block max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <svg
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          showUserMenu ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 glass rounded-xl shadow-xl border border-[var(--border)] overflow-hidden animate-fade-in-down">
                        {/* User Info Header */}
                        <div className="p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Links */}
                        <div className="p-2">
                          {userMenuLinks.map((link) => (
                            <a
                              key={link.href}
                              href={link.href}
                              onClick={() => setShowUserMenu(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                isActive(link.href)
                                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                  : "text-foreground hover:bg-[var(--muted)]"
                              }`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={link.icon}
                                />
                              </svg>
                              {link.name}
                            </a>
                          ))}
                        </div>

                        {/* Logout */}
                        <div className="p-2 border-t border-[var(--border)]">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Cerrar sesion
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <a
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-foreground hover:text-[var(--primary)] transition-colors"
                  >
                    Iniciar sesion
                  </a>
                  <a href="/register" className="btn-primary text-sm">
                    Comenzar gratis
                  </a>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg
                  className="w-6 h-6 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showMobileMenu ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden glass border-t border-[var(--border)] animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
              {primaryLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.href)
                      ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white"
                      : "text-foreground hover:bg-[var(--muted)]"
                  }`}
                >
                  {link.icon}
                  {link.name}
                  {link.badge && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[var(--accent)] text-white rounded-md">
                      {link.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer para compensar el navbar fixed */}
      <div className="h-16" />
    </>
  );
}
