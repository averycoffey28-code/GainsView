"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className = "",
  hoverEffect = true,
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-xl bg-brown-800/50 border border-brown-700/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      whileHover={
        hoverEffect
          ? {
              y: -2,
              boxShadow: "0 8px 30px rgba(212, 184, 150, 0.08)",
              transition: { duration: 0.2, ease: "easeOut" },
            }
          : undefined
      }
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Gold accent card variant
interface GoldCardProps {
  children: ReactNode;
  className?: string;
}

export function GoldCard({ children, className = "" }: GoldCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-xl bg-gradient-to-br from-gold-400/10 to-gold-600/5 border border-gold-400/30",
        className
      )}
      whileHover={{
        boxShadow: "0 8px 30px rgba(212, 184, 150, 0.15)",
        borderColor: "rgba(212, 184, 150, 0.5)",
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      {children}
    </motion.div>
  );
}

// Stat card with number animation support
interface StatCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function StatCard({ children, className = "", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={cn(
        "p-4 rounded-xl bg-brown-800/50 border border-brown-700/50",
        className
      )}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 30px rgba(212, 184, 150, 0.08)",
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      {children}
    </motion.div>
  );
}
