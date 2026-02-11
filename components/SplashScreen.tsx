"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if splash has already been shown this session
    const splashShown = sessionStorage.getItem("gainsview_splash_shown");
    if (splashShown) {
      setShowSplash(false);
      return;
    }

    // Show splash
    setShowSplash(true);
    sessionStorage.setItem("gainsview_splash_shown", "true");

    // Start fade out after animation completes
    const fadeTimer = setTimeout(() => setFadeOut(true), 3000);
    // Remove splash from DOM after fade out
    const removeTimer = setTimeout(() => setShowSplash(false), 3800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Don't render anything on server or if splash shouldn't show
  if (!mounted || !showSplash) return null;

  const letters = "GAINSVIEW".split("");

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0806] transition-opacity duration-[800ms] ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo with pulse animation - oversized image technique for crisp display */}
      <div className="splash-logo w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 mb-8 flex items-center justify-center overflow-hidden rounded-full">
        <img
          src="/images/logo.png"
          alt="GainsView"
          className="w-[200%] h-[200%] max-w-none object-contain"
        />
      </div>

      {/* Letter-by-letter text reveal */}
      <div className="flex items-center justify-center tracking-[0.3em] font-serif">
        {letters.map((letter, index) => (
          <span
            key={index}
            className="splash-letter text-3xl md:text-4xl lg:text-5xl font-bold text-[#D4AF37]"
            style={{
              animationDelay: `${1500 + index * 80}ms`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Subtle tagline */}
      <p className="splash-tagline mt-4 text-sm text-[#8B7355] tracking-widest uppercase">
        Premium Trading Analytics
      </p>

      <style jsx>{`
        @keyframes logoPulse {
          0% {
            opacity: 0;
            transform: scale(0.9);
            filter: drop-shadow(0 0 0px rgba(212, 175, 55, 0));
          }
          50% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.6));
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.35));
          }
        }

        @keyframes letterReveal {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes taglineReveal {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .splash-logo {
          opacity: 0;
          animation: logoPulse 1.5s ease-out forwards;
        }

        .splash-letter {
          opacity: 0;
          animation: letterReveal 0.4s ease-out forwards;
        }

        .splash-tagline {
          opacity: 0;
          animation: taglineReveal 0.6s ease-out forwards;
          animation-delay: 2.3s;
        }
      `}</style>
    </div>
  );
}
