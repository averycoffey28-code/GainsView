"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "hero" | "large" | "medium" | "small" | "tiny";
  showText?: boolean;
  className?: string;
  glow?: boolean;
  animate?: boolean;
  priority?: boolean;
}

// Logo size system - PROMINENT and PROUD
const sizeMap = {
  hero: { mobile: 120, desktop: 200, text: "text-3xl", glowScale: "scale-125", glowBlur: "blur-3xl" },
  large: { mobile: 80, desktop: 96, text: "text-2xl", glowScale: "scale-115", glowBlur: "blur-2xl" },
  medium: { mobile: 56, desktop: 64, text: "text-xl", glowScale: "scale-110", glowBlur: "blur-xl" },
  small: { mobile: 40, desktop: 48, text: "text-lg", glowScale: "scale-110", glowBlur: "blur-lg" },
  tiny: { mobile: 32, desktop: 32, text: "text-base", glowScale: "scale-105", glowBlur: "blur-md" },
};

export default function Logo({
  size = "medium",
  showText = false,
  className,
  glow = false,
  animate = false,
  priority = false,
}: LogoProps) {
  const { mobile, desktop, text, glowScale, glowBlur } = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative",
          glow && "drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]",
          animate && "animate-pulse"
        )}
      >
        {/* Gold glow background effect */}
        {glow && (
          <div
            className={cn(
              "absolute inset-0 opacity-40 bg-gold-400 rounded-full",
              glowBlur,
              glowScale
            )}
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
