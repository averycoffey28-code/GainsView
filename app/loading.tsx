import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-full h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex flex-col items-center justify-center">
      {/* Logo with pulse animation */}
      <div className="relative animate-pulse">
        {/* Gold glow effect */}
        <div className="absolute inset-0 blur-2xl opacity-40 bg-gold-400 rounded-full scale-125" />
        <Image
          src="/images/logo.png"
          alt="GainsView"
          width={120}
          height={120}
          className="relative z-10"
          priority
        />
      </div>

      {/* Brand name */}
      <h1 className="mt-6 text-2xl font-bold text-brown-50 tracking-tight">
        GainsView
      </h1>
      <p className="mt-2 text-sm text-brown-400">
        Premium Options Trading Platform
      </p>

      {/* Loading indicator */}
      <div className="mt-8 flex gap-1">
        <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
