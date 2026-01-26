"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  glow?: boolean;
  animate?: boolean;
  priority?: boolean; // Only set priority for above-the-fold logos
}

// Responsive sizes: mobile / desktop
const sizeMap = {
  sm: { mobile: 56, desktop: 72, text: "text-lg" },       // Page headers
  md: { mobile: 64, desktop: 88, text: "text-xl" },       // Home page header
  lg: { mobile: 100, desktop: 140, text: "text-2xl" },    // AI welcome
  xl: { mobile: 120, desktop: 180, text: "text-3xl" },    // Sign-in hero
};

export default function Logo({
  size = "md",
  showText = false,
  className,
  glow = false,
  animate = false,
  priority = false,
}: LogoProps) {
  const { mobile, desktop, text } = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative",
          glow && "drop-shadow-[0_0_25px_rgba(212,184,150,0.4)]",
          animate && "animate-pulse"
        )}
      >
        {/* Gold glow background effect */}
        {glow && (
          <div
            className="absolute inset-0 blur-2xl opacity-30 bg-gold-400 rounded-full scale-110"
          />
        )}
        {/* Mobile logo */}
        <Image
          src="/images/logo.png"
          alt="GainsView"
          width={mobile}
          height={mobile}
          className={cn(
            "relative z-10 object-contain md:hidden",
            animate && "animate-[fadeIn_0.5s_ease-out]"
          )}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
        {/* Desktop logo */}
        <Image
          src="/images/logo.png"
          alt="GainsView"
          width={desktop}
          height={desktop}
          className={cn(
            "relative z-10 object-contain hidden md:block",
            animate && "animate-[fadeIn_0.5s_ease-out]"
          )}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      </div>
      {showText && (
        <h1 className={cn("font-bold text-brown-50 tracking-tight", text)}>
          GainsView
        </h1>
      )}
    </div>
  );
}
