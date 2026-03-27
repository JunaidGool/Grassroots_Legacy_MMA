"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { isAdmin, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleAuthAction = async () => {
    if (isAdmin) {
      setLoggingOut(true);
      await logout();
      setLoggingOut(false);
      router.push("/dashboard");
    } else {
      router.push("/admin/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo/grass_roots_logo.jpeg"
            alt="Grassroots Legacy MMA"
            width={44}
            height={44}
            className="rounded-full ring-2 ring-gold-500/40"
            priority
          />
          <span className="font-heading text-lg font-semibold tracking-wide text-foreground hidden sm:block">
            GRASSROOTS LEGACY
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/register"
              className="text-xs font-medium text-gold-400 hover:text-gold-300 transition-colors"
            >
              Admin
            </Link>
          )}
          <button
            onClick={handleAuthAction}
            disabled={loggingOut}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-dark-600 transition-colors"
            title={isAdmin ? "Logout" : "Admin Login"}
          >
            {isAdmin ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#808080" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
