"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DollarSign, TrendingUp, Home, Brain, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/portfolio",
    icon: DollarSign,
    label: "Portfolio",
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-brown-900/80 backdrop-blur-xl border-t border-brown-700/50" />

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
                  "flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-gold-400"
                    : "text-brown-400 hover:text-brown-200"
                )}
              >
                {/* Icon container with active indicator */}
                <div
                  className={cn(
                    "relative p-2 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-gold-400/15"
                      : "hover:bg-brown-800/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive && "scale-110"
                    )}
                  />
                  {/* Active dot indicator */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-400 rounded-full" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium mt-1 transition-all duration-200",
                    isActive ? "text-gold-400" : "text-brown-500"
                  )}
                >
                  {item.label}
                </span>
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
