"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { TrendingUp, Brain, Shield, BarChart3, Lock, Zap, Sparkles, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Market Data",
    description: "Live options chains and stock quotes",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
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
    <div className="min-h-screen bg-brown-950 flex">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-400/3 rounded-full blur-3xl" />
      </div>

      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Gold accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-gold-400/30 to-transparent" />

        {/* Top section - Logo and tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-40 bg-gold-400 rounded-full scale-150" />
              <Image
                src="/images/logo.png"
                alt="GainsView"
                width={80}
                height={80}
                className="relative z-10"
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
        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-20">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-3xl opacity-30 bg-gold-400 rounded-full scale-125" />
              <Image
                src="/images/logo.png"
                alt="GainsView"
                width={180}
                height={180}
                className="relative z-10 drop-shadow-[0_0_40px_rgba(212,184,150,0.3)]"
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
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 relative z-10">
        {/* Mobile logo (shown only on mobile) */}
        <div className="lg:hidden text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 blur-2xl opacity-40 bg-gold-400 rounded-full scale-150" />
            <Image
              src="/images/logo.png"
              alt="GainsView"
              width={80}
              height={80}
              className="relative z-10"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-brown-50 tracking-tight">GainsView</h1>
          <p className="text-gold-400 text-sm font-medium mt-1">Premium Options Trading Platform</p>

          {/* Mobile social proof */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="px-2 py-0.5 bg-gold-400/20 text-gold-400 text-xs font-semibold rounded-full border border-gold-400/30">
                Beta
              </span>
            </div>
            <div className="h-3 w-px bg-brown-700" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-brown-400 text-xs">Secure</span>
            </div>
          </div>
        </div>

        {/* Sign up card */}
        <div className="w-full max-w-md">
          {/* Card header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brown-50 mb-2">Create your account</h2>
            <p className="text-brown-400">Start your trading journey today</p>
          </div>

          {/* Clerk SignUp */}
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-brown-900/60 backdrop-blur-xl border border-brown-700/50 shadow-2xl shadow-black/20 rounded-2xl p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-brown-800/60 border-brown-700 text-brown-100 hover:bg-brown-700/60 hover:border-brown-600 rounded-xl py-3.5 transition-all duration-200",
                socialButtonsBlockButtonText: "text-brown-100 font-medium",
                socialButtonsBlockButtonArrow: "text-brown-400",
                dividerLine: "bg-brown-700/50",
                dividerText: "text-brown-500 text-xs bg-brown-900/60 px-3",
                formFieldLabel: "text-brown-300 text-sm font-medium",
                formFieldInput:
                  "bg-brown-800/60 border-brown-700 text-brown-100 placeholder:text-brown-500 rounded-xl py-3.5 focus:border-gold-500 focus:ring-gold-500/20 transition-all duration-200",
                formButtonPrimary:
                  "bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold rounded-xl py-3.5 shadow-lg shadow-gold-500/20 transition-all duration-200",
                footerActionLink: "text-gold-400 hover:text-gold-300 font-medium",
                footerActionText: "text-brown-400",
                identityPreviewEditButton: "text-gold-400 hover:text-gold-300",
                formFieldAction: "text-gold-400 hover:text-gold-300",
                alert: "bg-rose-500/10 border-rose-500/30 text-rose-400 rounded-xl",
                formFieldInputShowPasswordButton: "text-brown-400 hover:text-brown-300",
                otpCodeFieldInput: "bg-brown-800/60 border-brown-700 text-brown-100 rounded-lg",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/"
          />

          {/* Secure signup badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-brown-500 text-sm">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>Secure signup powered by Clerk</span>
          </div>

          {/* Risk disclaimer */}
          <p className="mt-6 text-xs text-brown-600 text-center leading-relaxed">
            By signing up, you agree to our Terms of Service and acknowledge that options
            trading involves substantial risk. You must be 18+ to use this platform.
          </p>
        </div>

        {/* Mobile features (shown only on mobile) */}
        <div className="lg:hidden mt-8 w-full max-w-md">
          <div className="grid grid-cols-3 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center p-3 bg-brown-800/30 rounded-xl border border-brown-700/30">
                  <div className="inline-flex p-2 bg-gold-400/10 rounded-lg mb-2">
                    <Icon className="w-4 h-4 text-gold-400" />
                  </div>
                  <p className="text-brown-300 text-xs font-medium leading-tight">{feature.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
