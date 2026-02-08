"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, TrendingUp, Home, Brain, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/portfolio",
    icon: LineChart,
    label: "Markets",
  },
  {
    href: "/pnl",
    icon: TrendingUp,
    label: "P&L",
  },
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "/ai",
    icon: Brain,
    label: "AI",
  },
  {
    href: "/menu",
    icon: Menu,
    label: "Menu",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide nav on auth pages and onboarding
  const hiddenPages = ["/sign-in", "/sign-up", "/login", "/signup", "/onboarding"];
  const isHiddenPage = hiddenPages.some(page => pathname?.startsWith(page));

  if (isHiddenPage) {
    return null;
  }

  return (
    <nav className="flex-shrink-0 relative">
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-brown-900/95 backdrop-blur-xl border-t border-brown-700/50" />

      {/* Nav content */}
      <div className="relative max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[56px] min-h-[56px] py-1 px-2 rounded-xl transition-colors duration-200",
                  isActive
                    ? "text-gold-400"
                    : "text-brown-400 hover:text-brown-200"
                )}
              >
                {/* Icon container with active indicator - 44px min touch target */}
                <motion.div
                  className={cn(
                    "relative p-2.5 rounded-xl transition-colors duration-200",
                    isActive
                      ? "bg-gold-400/15"
                      : "hover:bg-brown-800/50"
                  )}
                  whileTap={{
                    scale: [1, 1.2, 0.9, 1.05, 1],
                    transition: { duration: 0.3 }
                  }}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive && "scale-110 nav-glow"
                    )}
                  />
                </motion.div>

                {/* Label */}
                <motion.span
                  className={cn(
                    "text-xs font-medium mt-1 transition-colors duration-200",
                    isActive ? "text-gold-400" : "text-brown-500"
                  )}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    fontWeight: isActive ? 600 : 500,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
}
