"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "hero" | "large" | "header" | "medium" | "small" | "nav" | "tiny";
  showText?: boolean;
  className?: string;
  glow?: boolean;
  animate?: boolean;
  priority?: boolean;
}

const sizeMap = {
  hero: { mobile: 120, desktop: 180, text: "text-3xl" },
  large: { mobile: 80, desktop: 96, text: "text-2xl" },
  header: { mobile: 58, desktop: 68, text: "text-xl" },
  medium: { mobile: 40, desktop: 48, text: "text-xl" },
  small: { mobile: 36, desktop: 40, text: "text-lg" },
  nav: { mobile: 28, desktop: 32, text: "text-base" },
  tiny: { mobile: 20, desktop: 24, text: "text-sm" },
};

export default function Logo({
  size = "medium",
  showText = false,
  className,
  glow = false,
  animate = false,
  priority = false,
}: LogoProps) {
  const { mobile, desktop, text } = sizeMap[size];

  // The source image has ~60% transparent whitespace around the bull.
  // We render the image 2.2x larger inside a fixed-size container with
  // overflow-hidden to clip the whitespace. The drop-shadow filter goes
  // on the container so it follows the clipped bull shape without being
  // clipped itself. Using a large width/height (256) + quality={100}
  // ensures crisp rendering on retina displays.
  const glowFilter = glow
    ? "drop-shadow(0 0 8px rgba(212,175,55,0.4)) drop-shadow(0 0 16px rgba(212,175,55,0.2))"
    : undefined;

  const mobileImgSize = Math.round(mobile * 2.2);
  const desktopImgSize = Math.round(desktop * 2.2);

  return (
    <div className={cn("flex items-center gap-3 shrink-0", className)}>
      {/* Mobile logo */}
      <div
        className={cn(
          "shrink-0 overflow-hidden flex items-center justify-center md:hidden self-center",
          animate && "animate-[fadeIn_0.5s_ease-out]"
        )}
        style={{ width: mobile, height: mobile, filter: glowFilter }}
      >
        <Image
          src="/images/logo.png"
          alt="GainsView"
          width={256}
          height={256}
          quality={100}
          className="max-w-none object-contain"
          style={{ width: mobileImgSize, height: mobileImgSize, transform: "translateY(8px)" }}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      </div>
      {/* Desktop logo */}
      <div
        className={cn(
          "shrink-0 overflow-hidden items-center justify-center hidden md:flex self-center",
          animate && "animate-[fadeIn_0.5s_ease-out]"
        )}
        style={{ width: desktop, height: desktop, filter: glowFilter }}
      >
        <Image
          src="/images/logo.png"
          alt="GainsView"
          width={256}
          height={256}
          quality={100}
          className="max-w-none object-contain"
          style={{ width: desktopImgSize, height: desktopImgSize, transform: "translateY(8px)" }}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      </div>
      {showText && (
        <span className={cn("font-bold text-brown-50 tracking-tight", text)}>
          GainsView
        </span>
      )}
    </div>
  );
}
