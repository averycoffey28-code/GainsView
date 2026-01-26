"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { TrendingUp, Brain, Shield, BarChart3, Lock, Zap, Sparkles, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Data",
    description: "Live options chains and stock quotes",
  },
  {
    icon: Brain,
    title: "AI Insights",
    description: "Smart trading recommendations",
  },
  {
    icon: TrendingUp,
    title: "P&L Analytics",
    description: "Professional portfolio tracking",
  },
];

const benefits = [
  "Unlimited options calculations",
  "AI trading assistant",
  "Portfolio tracking & analytics",
  "Real-time market data",
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-brown-950 flex overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950" />
        <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gold-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-gold-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-gold-400/3 rounded-full blur-3xl" />
      </div>

      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Gold accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-gold-400/30 to-transparent" />

        {/* Top section - Logo and tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-50 bg-gold-400 rounded-full scale-150" />
              <Image
                src="/images/logo.png"
                alt="GainsView"
                width={64}
                height={64}
                className="relative z-10 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-brown-50 tracking-tight">GainsView</h1>
              <p className="text-gold-400 text-sm font-medium">Premium Options Trading</p>
            </div>
          </div>
        </div>

        {/* Center section - Hero */}
        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-16">
          <div className="mb-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-3xl opacity-50 bg-gold-400 rounded-full scale-150" />
              <Image
                src="/images/logo.png"
                alt="GainsView"
                width={220}
                height={220}
                className="relative z-10 drop-shadow-[0_0_50px_rgba(212,175,55,0.5)]"
                priority
              />
            </div>
          </div>

          <h2 className="text-4xl font-bold text-brown-50 mb-4 leading-tight">
            Start Trading<br />
            <span className="text-gold-400">Like a Pro.</span>
          </h2>

          <p className="text-brown-400 text-lg mb-8 max-w-md">
            Professional-grade options analytics to help you make smarter trading decisions.
          </p>

          {/* Benefits list */}
          <div className="space-y-3 mb-8">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-brown-200">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <span className="px-2.5 py-1 bg-gold-400/20 text-gold-400 text-xs font-semibold rounded-full border border-gold-400/30">
                Beta
              </span>
            </div>
            <div className="h-4 w-px bg-brown-700" />
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold-400" />
              <span className="text-brown-300 text-sm">
                <span className="text-brown-50 font-semibold">Real-time</span> data
              </span>
            </div>
          </div>
        </div>

        {/* Bottom section - Trust badges */}
        <div className="relative z-10 pt-8 border-t border-brown-800/50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-brown-500 text-sm">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2 text-brown-500 text-sm">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Encrypted data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 py-8 sm:p-8 lg:p-12 relative z-10 min-h-screen lg:min-h-0">
        {/* Mobile logo (shown only on mobile) */}
        <div className="lg:hidden text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 blur-3xl opacity-50 bg-gold-400 rounded-full scale-150" />
            <Image
              src="/images/logo.png"
              alt="GainsView"
              width={120}
              height={120}
              className="relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-brown-50 tracking-tight">GainsView</h1>
          <p className="text-gold-400 text-sm font-medium mt-1">Premium Options Trading</p>

          {/* Mobile social proof */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span className="px-2 py-0.5 bg-gold-400/20 text-gold-400 text-xs font-semibold rounded-full border border-gold-400/30">
                Beta
              </span>
            </div>
            <div className="h-3 w-px bg-brown-700" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-brown-400 text-xs">Secure</span>
            </div>
          </div>
        </div>

        {/* Sign up card */}
        <div className="w-full max-w-[400px]">
          {/* Card header */}
          <div className="text-center mb-5 lg:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brown-50 mb-1">Create your account</h2>
            <p className="text-brown-400 text-sm">Start your trading journey today</p>
          </div>

          {/* Clerk SignUp */}
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-brown-900/60 backdrop-blur-xl border border-brown-700/50 shadow-2xl shadow-black/20 rounded-2xl p-0 !shadow-none sm:!shadow-2xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "w-full bg-brown-800/60 border-brown-700 text-brown-100 hover:bg-brown-700/60 hover:border-brown-600 rounded-xl min-h-[48px] py-3 transition-all duration-200 touch-manipulation",
                socialButtonsBlockButtonText: "text-brown-100 font-medium text-sm",
                socialButtonsBlockButtonArrow: "text-brown-400",
                socialButtonsProviderIcon: "w-5 h-5",
                dividerLine: "bg-brown-700/50",
                dividerText: "text-brown-500 text-xs bg-brown-900/60 px-3",
                formFieldLabel: "text-brown-300 text-sm font-medium",
                formFieldInput:
                  "w-full bg-brown-800/60 border-brown-700 text-brown-100 placeholder:text-brown-500 rounded-xl min-h-[48px] py-3 px-4 text-base focus:border-gold-500 focus:ring-gold-500/20 transition-all duration-200",
                formFieldInputShowPasswordButton:
                  "text-brown-400 hover:text-brown-200 !right-3 w-10 h-10 flex items-center justify-center touch-manipulation",
                formFieldInputShowPasswordIcon: "w-5 h-5",
                formButtonPrimary:
                  "w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold rounded-xl min-h-[48px] py-3 shadow-lg shadow-gold-500/20 transition-all duration-200 touch-manipulation",
                footerActionLink: "text-gold-400 hover:text-gold-300 font-medium",
                footerActionText: "text-brown-400 text-sm",
                identityPreviewEditButton: "text-gold-400 hover:text-gold-300 min-h-[44px] touch-manipulation",
                formFieldAction: "text-gold-400 hover:text-gold-300 text-sm",
                alert: "bg-rose-500/10 border-rose-500/30 text-rose-400 rounded-xl text-sm",
                otpCodeFieldInput: "bg-brown-800/60 border-brown-700 text-brown-100 rounded-lg min-h-[48px]",
                footer: "!bg-transparent",
                cardBox: "!shadow-none",
                main: "gap-4",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/"
          />

          {/* Secure signup badge */}
          <div className="flex items-center justify-center gap-2 mt-5 text-brown-500 text-xs sm:text-sm">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure signup powered by Clerk</span>
          </div>

          {/* Risk disclaimer */}
          <p className="mt-4 text-[10px] sm:text-xs text-brown-600 text-center leading-relaxed px-2">
            By signing up, you agree to our Terms of Service and acknowledge that options
            trading involves substantial risk. You must be 18+ to use this platform.
          </p>
        </div>

        {/* Mobile features (shown only on mobile) - simplified */}
        <div className="lg:hidden mt-6 w-full max-w-[400px]">
          <div className="flex justify-center gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="inline-flex p-2 bg-gold-400/10 rounded-lg mb-1.5">
                    <Icon className="w-4 h-4 text-gold-400" />
                  </div>
                  <p className="text-brown-400 text-[10px] font-medium leading-tight">{feature.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
