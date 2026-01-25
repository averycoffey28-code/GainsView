"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, Sparkles, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setEmailSent(true);
    }
    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="p-4 bg-emerald-500/20 rounded-2xl w-fit mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-brown-50 mb-2">Check your email</h1>
          <p className="text-brown-400 mb-6">
            We sent a password reset link to <span className="text-gold-400">{email}</span>
          </p>
          <Link href="/login">
            <Button variant="ghost" className="text-brown-400 hover:text-brown-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-gold-400/20 to-gold-600/20 rounded-2xl mb-4 border border-gold-400/20">
            <Sparkles className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold text-brown-50 tracking-tight">GainsView</h1>
        </div>

        <div className="bg-brown-900/50 backdrop-blur-xl border border-brown-700/50 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-brown-50 text-center mb-2">
            Forgot password?
          </h2>
          <p className="text-brown-400 text-center text-sm mb-6">
            No worries, we&apos;ll send you reset instructions.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-400 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold-500 hover:bg-gold-600 text-brown-900 font-semibold py-6 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Reset password"
              )}
            </Button>
          </form>

          <Link href="/login">
            <Button variant="ghost" className="w-full mt-4 text-brown-400 hover:text-brown-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
