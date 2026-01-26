import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-full h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex flex-col items-center justify-center">
      {/* Logo with pulse animation - LARGE and PROUD */}
      <div className="relative animate-pulse">
        {/* Gold glow effect */}
        <div className="absolute inset-0 blur-3xl opacity-50 bg-gold-400 rounded-full scale-150" />
        {/* Mobile */}
        <Image
          src="/images/logo.png"
          alt="GainsView"
          width={150}
          height={150}
          className="relative z-10 drop-shadow-[0_0_40px_rgba(212,175,55,0.5)] md:hidden"
          priority
        />
        {/* Desktop */}
        <Image
          src="/images/logo.png"
          alt="GainsView"
          width={200}
          height={200}
          className="relative z-10 drop-shadow-[0_0_50px_rgba(212,175,55,0.5)] hidden md:block"
          priority
        />
      </div>

      {/* Brand name */}
      <h1 className="mt-8 text-3xl font-bold text-brown-50 tracking-tight">
        GainsView
      </h1>
      <p className="mt-2 text-sm text-brown-400">
        Premium Options Trading Platform
      </p>

      {/* Loading indicator */}
      <div className="mt-10 flex gap-1.5">
        <span className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
