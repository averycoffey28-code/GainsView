"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Smartphone,
  Key,
  FileText,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  href?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

const accountItems: MenuItem[] = [
  {
    icon: User,
    label: "Profile",
    description: "Manage your account details",
  },
  {
    icon: CreditCard,
    label: "Subscription",
    description: "Billing and plan details",
    badge: "Free",
    badgeColor: "bg-gold-400/20 text-gold-400",
  },
  {
    icon: Key,
    label: "API Keys",
    description: "Tradier and other integrations",
  },
];

const preferencesItems: MenuItem[] = [
  {
    icon: Bell,
    label: "Notifications",
    description: "Alerts and reminders",
  },
  {
    icon: Moon,
    label: "Appearance",
    description: "Dark mode enabled",
    badge: "On",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
  },
  {
    icon: Smartphone,
    label: "Mobile Settings",
    description: "App preferences",
  },
];

const supportItems: MenuItem[] = [
  {
    icon: HelpCircle,
    label: "Help & Support",
    description: "FAQs and contact us",
  },
  {
    icon: FileText,
    label: "Terms & Privacy",
    description: "Legal documents",
  },
  {
    icon: Shield,
    label: "Security",
    description: "Password and 2FA",
  },
];

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">{title}</h2>
      <Card className="bg-brown-800/50 border-brown-700">
        <CardContent className="p-0 divide-y divide-brown-700/50">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-brown-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Icon className="w-5 h-5 text-brown-300" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-brown-100">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-brown-500">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className={`text-xs border-0 ${item.badgeColor || "bg-brown-700 text-brown-300"}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-brown-500" />
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MenuPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header - User Profile */}
        <div className="text-center py-6">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName || "User"}
              className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-gold-400/30"
            />
          ) : (
            <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-gold-400" />
            </div>
          )}
          <h1 className="text-xl font-bold text-brown-50">
            {user?.fullName || user?.firstName || "User"}
          </h1>
          <p className="text-sm text-brown-400">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>

        {/* Account Section */}
        <MenuSection title="ACCOUNT" items={accountItems} />

        {/* Preferences Section */}
        <MenuSection title="PREFERENCES" items={preferencesItems} />

        {/* Support Section */}
        <MenuSection title="SUPPORT" items={supportItems} />

        {/* Sign Out */}
        <Card className="bg-brown-800/50 border-brown-700">
          <CardContent className="p-0">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 p-4 text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-xs text-brown-600 py-4">
          <p>GainsView</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
