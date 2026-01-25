"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, Check, AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Required checkboxes
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [understandRisk, setUnderstandRisk] = useState(false);
  const [isAdult, setIsAdult] = useState(false);

  const supabase = createClient();

  const allChecked = agreeTerms && understandRisk && isAdult;

  const handleGoogleSignUp = async () => {
    if (!allChecked) {
      setError("Please accept all required agreements to continue");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    if (!allChecked) {
      setError("Please accept all required agreements to continue");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allChecked) {
      setError("Please accept all required agreements to continue");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setEmailSent(true);
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="p-4 bg-emerald-500/20 rounded-2xl w-fit mx-auto mb-6">
            <Mail className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-brown-50 mb-2">Verify your email</h1>
          <p className="text-brown-400 mb-6">
            We sent a confirmation link to <span className="text-gold-400">{email}</span>
          </p>
          <p className="text-sm text-brown-500 mb-6">
            Click the link in your email to activate your account.
          </p>
          <Button
            variant="ghost"
            onClick={() => setEmailSent(false)}
            className="text-brown-400 hover:text-brown-200"
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center p-4 pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-gold-400/20 to-gold-600/20 rounded-2xl mb-4 border border-gold-400/20">
            <Sparkles className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold text-brown-50 tracking-tight">GainsView</h1>
          <p className="text-brown-400 mt-2">Start your 14-day free trial</p>
        </div>

        {/* Auth Card */}
        <div className="bg-brown-900/50 backdrop-blur-xl border border-brown-700/50 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-brown-50 text-center mb-6">
            Create your account
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-400 text-center">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-6 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              onClick={handleAppleSignUp}
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-900 text-white font-medium py-6 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brown-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brown-900/50 px-4 text-brown-500">or sign up with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-brown-300">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 py-6 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-brown-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 py-6 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-brown-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 py-6 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-500 hover:text-brown-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-brown-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-500" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 py-6 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Required Checkboxes */}
            <div className="space-y-3 py-4 border-t border-b border-brown-700/50">
              <p className="text-xs text-brown-400 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gold-400" />
                Required Agreements
              </p>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    agreeTerms
                      ? "bg-gold-500 border-gold-500"
                      : "border-brown-600 group-hover:border-brown-500"
                  }`}
                  onClick={() => setAgreeTerms(!agreeTerms)}
                >
                  {agreeTerms && <Check className="w-3 h-3 text-brown-900" />}
                </div>
                <span className="text-sm text-brown-300">
                  I agree to the{" "}
                  <Link href="/terms" className="text-gold-400 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-gold-400 hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    understandRisk
                      ? "bg-gold-500 border-gold-500"
                      : "border-brown-600 group-hover:border-brown-500"
                  }`}
                  onClick={() => setUnderstandRisk(!understandRisk)}
                >
                  {understandRisk && <Check className="w-3 h-3 text-brown-900" />}
                </div>
                <span className="text-sm text-brown-300">
                  I understand options trading involves substantial risk and is not suitable for all investors
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isAdult
                      ? "bg-gold-500 border-gold-500"
                      : "border-brown-600 group-hover:border-brown-500"
                  }`}
                  onClick={() => setIsAdult(!isAdult)}
                >
                  {isAdult && <Check className="w-3 h-3 text-brown-900" />}
                </div>
                <span className="text-sm text-brown-300">
                  I am 18 years of age or older
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !allChecked}
              className="w-full bg-gold-500 hover:bg-gold-600 text-brown-900 font-semibold py-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-brown-400">
            Already have an account?{" "}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
