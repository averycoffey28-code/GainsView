import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-gold-400/20 to-gold-600/20 rounded-2xl mb-4 border border-gold-400/20">
            <Sparkles className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="text-3xl font-bold text-brown-50 tracking-tight">GainsView</h1>
          <p className="text-brown-400 mt-2">Premium Options Trading Platform</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-brown-900/80 backdrop-blur-xl border border-brown-700/50 shadow-2xl rounded-2xl",
              headerTitle: "text-brown-50 text-xl",
              headerSubtitle: "text-brown-400",
              socialButtonsBlockButton:
                "bg-brown-800/50 border-brown-700 text-brown-100 hover:bg-brown-700/50 rounded-xl py-3",
              socialButtonsBlockButtonText: "text-brown-100 font-medium",
              dividerLine: "bg-brown-700",
              dividerText: "text-brown-500 text-xs",
              formFieldLabel: "text-brown-300 text-sm",
              formFieldInput:
                "bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 rounded-xl py-3",
              formButtonPrimary:
                "bg-gold-500 hover:bg-gold-600 text-brown-900 font-semibold rounded-xl py-3",
              footerActionLink: "text-gold-400 hover:text-gold-300",
              identityPreviewEditButton: "text-gold-400 hover:text-gold-300",
              formFieldAction: "text-gold-400 hover:text-gold-300",
              alert: "bg-rose-500/10 border-rose-500/30 text-rose-400",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}
