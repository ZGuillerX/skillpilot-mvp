// src/components/Navbar.jsx
"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const quickLinks = [
    { name: "Inicio", href: "/" },
    { name: "Aprender", href: "/onboarding" },
    { name: "Practicar", href: "/challenges" },
    { name: "Construir", href: "/custom-challenges" },
    { name: "Mi Historial", href: "/history" },
    { name: "Estadísticas", href: "/stats" },
  ];

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
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-foreground"
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
                </div>
                <span className="text-xl font-black text-foreground">
                  Skill<span className="text-primary">Pilot</span>
                </span>
              </a>
            </div>

            {/* Links principales */}
            <div className="hidden md:flex items-center gap-1">
              {primaryLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  {link.icon}
                  {link.name}
                </a>
              ))}
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {user.name}
                  </span>
                  <svg
                    className="w-4 h-4 text-muted-foreground"
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

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                    {quickLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {link.name}
                      </a>
                    ))}
                    <div className="my-1 border-t border-border" />
                    <a
                      href="/profile"
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                      onClick={() => setShowUserMenu(false)}
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Mi Perfil
                    </a>
                    <a
                      href="/workspace-dashboard"
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                      onClick={() => setShowUserMenu(false)}
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
                          d="M3 7h18M3 12h18M3 17h18"
                        />
                      </svg>
                      Dashboard Workspace
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
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
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Iniciar sesión
                </a>
                <a
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Registrarse
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
