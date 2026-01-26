"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode, useState, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "default" | "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  ripple?: boolean;
  glow?: boolean;
}

export function AnimatedButton({
  children,
  className = "",
  variant = "default",
  size = "md",
  ripple = true,
  glow = false,
  onClick,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<RippleProps[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (ripple && !disabled) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const newRipple = { x, y, size };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 600);
    }

    onClick?.(e);
  };

  const variants = {
    default: "bg-brown-700 hover:bg-brown-600 text-brown-100 border-brown-600",
    gold: "bg-gold-500 hover:bg-gold-600 text-brown-900 border-gold-400",
    outline: "bg-transparent hover:bg-brown-700/50 text-brown-200 border-brown-600",
    ghost: "bg-transparent hover:bg-brown-800/50 text-brown-300 border-transparent",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden rounded-lg font-medium border transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        glow && variant === "gold" && "shadow-[0_0_20px_rgba(212,184,150,0.3)]",
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple, index) => (
        <motion.span
          key={index}
          className={cn(
            "absolute rounded-full pointer-events-none",
            variant === "gold" ? "bg-white/30" : "bg-gold-400/30"
          )}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {/* Active glow effect */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0"
          whileTap={{
            opacity: 1,
            boxShadow: "inset 0 0 20px rgba(212, 184, 150, 0.5)",
          }}
          transition={{ duration: 0.1 }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

// Icon button variant
interface AnimatedIconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "default" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
}

export function AnimatedIconButton({
  children,
  className = "",
  variant = "ghost",
  size = "md",
  disabled,
  ...props
}: AnimatedIconButtonProps) {
  const variants = {
    default: "bg-brown-700 hover:bg-brown-600 text-brown-100",
    ghost: "bg-transparent hover:bg-brown-800/50 text-brown-400 hover:text-brown-200",
    gold: "bg-gold-500/20 hover:bg-gold-500/30 text-gold-400",
  };

  const sizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  return (
    <motion.button
      className={cn(
        "rounded-lg transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={!disabled ? { scale: 1.1 } : undefined}
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      transition={{ duration: 0.15, ease: "easeOut" }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
