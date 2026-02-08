"use client";

import { useState, useEffect, useCallback } from "react";
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
  Sun,
  Smartphone,
  FileText,
  Loader2,
  Bug,
  Lightbulb,
  Globe,
  Check,
  ChevronDown,
  Clock,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useTimezone, TIMEZONE_OPTIONS } from "@/contexts/TimezoneContext";
import { useUserSettings } from "@/hooks/useUserData";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  href?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
  custom?: boolean;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

const REMINDER_TIME_OPTIONS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "16:15", label: "4:15 PM (Market Close)" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];

// accountItems and supportItems are defined inside the component to access user/router

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
  const { theme, toggleTheme } = useTheme();
  const {
    timezone,
    detectionMethod,
    setManualTimezone,
    resetToAutoDetect,
    getTimezoneAbbreviation,
    getTimezoneLabel,
  } = useTimezone();
  const [showTzPicker, setShowTzPicker] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const { settings, updateSettings } = useUserSettings();

  // Notification state
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPermissionDenied, setNotifPermissionDenied] = useState(false);
  const [reminderTime, setReminderTime] = useState("16:15");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Sync state from settings
  useEffect(() => {
    if (settings) {
      setNotifEnabled(settings.notifications_enabled && !!settings.push_endpoint);
      setReminderTime(settings.push_reminder_time || "16:15");
    }
  }, [settings]);

  // Check permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermissionDenied(Notification.permission === "denied");
    }
  }, []);

  const handleNotifToggle = useCallback(async (enabled: boolean) => {
    if (notifLoading) return;
    setNotifLoading(true);

    try {
      if (enabled) {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setNotifPermissionDenied(permission === "denied");
          setNotifLoading(false);
          return;
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.error("VAPID public key not configured");
          setNotifLoading(false);
          return;
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // Send subscription to server
        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            reminder_time: reminderTime,
          }),
        });

        if (res.ok) {
          setNotifEnabled(true);
        }
      } else {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }

        await fetch("/api/notifications/unsubscribe", { method: "POST" });
        setNotifEnabled(false);
      }
    } catch (error) {
      console.error("Notification toggle error:", error);
    } finally {
      setNotifLoading(false);
    }
  }, [notifLoading, reminderTime]);

  const handleTimeChange = useCallback(async (time: string) => {
    setReminderTime(time);
    setShowTimePicker(false);
    await updateSettings({ push_reminder_time: time });
  }, [updateSettings]);

  const isDark = theme === "dark";

  const accountItems: MenuItem[] = [
    {
      icon: User,
      label: "Profile",
      description: "Manage your account details",
      onClick: () => router.push("/menu/profile"),
    },
    {
      icon: CreditCard,
      label: "Subscription",
      description: "Billing and plan details",
      badge: "Free",
      badgeColor: "bg-gold-400/20 text-gold-400",
    },
  ];

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

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  const preferencesOtherItems: MenuItem[] = [
    {
      icon: Smartphone,
      label: "Mobile Settings",
      description: "App preferences",
      onClick: () => router.push("/menu/mobile"),
    },
  ];

  const faqs = [
    {
      id: 1,
      question: "Can I use the market data feature to trade? Does it have a delay?",
      answer: "No. The Markets page is intended for informational/reference purposes only and should not be used for trading decisions. Market data may be delayed by up to 15 minutes.",
    },
    {
      id: 2,
      question: "Can the trading AI predict which options contracts and stocks I should buy?",
      answer: "No. Your personal trading AI is designed to help you review trades, answer trading-related questions, and learn about trading strategies and concepts. It does not provide predictions or specific buy/sell recommendations.",
    },
    {
      id: 3,
      question: "I'm noticing bugs with my app and trading log. Who should I contact?",
      answer: "Please use the Report a Bug feature in the Menu tab to submit the issue to our team.",
    },
  ];

  const handleContactSupport = () => {
    window.location.href = `mailto:gainsview@gmail.com?subject=${encodeURIComponent(
      "GainsView Support Request"
    )}&body=${encodeURIComponent(
      `Hi GainsView Support,\n\nI have a question about:\n\n`
    )}`;
  };

  const handleReportBug = () => {
    window.location.href = `mailto:gainsview@gmail.com?subject=${encodeURIComponent(
      "GainsView Bug Report"
    )}&body=${encodeURIComponent(
      `Bug Description:\n\nSteps to Reproduce:\n1. \n2. \n3. \n\nExpected Behavior:\n\nActual Behavior:\n\n`
    )}`;
  };

  const handleFeatureRequest = () => {
    window.location.href = `mailto:gainsview@gmail.com?subject=${encodeURIComponent(
      "GainsView Feature Request"
    )}&body=${encodeURIComponent(
      `Feature Request:\n\nWhat would you like to see added to GainsView?\n\n`
    )}`;
  };

  const legalItems: MenuItem[] = [
    {
      icon: FileText,
      label: "Terms & Privacy",
      description: "Legal documents",
      onClick: () => router.push("/menu/terms"),
    },
    {
      icon: Shield,
      label: "Security",
      description: "Password",
      onClick: () => setShowSecurityModal(true),
    },
  ];

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

        {/* Preferences Section - with inline dark mode toggle */}
        <div>
          <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">PREFERENCES</h2>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-0 divide-y divide-brown-700/50">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    {isDark ? (
                      <Moon className="w-5 h-5 text-brown-300" />
                    ) : (
                      <Sun className="w-5 h-5 text-brown-300" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-brown-100">Dark Mode</p>
                    <p className="text-xs text-brown-500">
                      {isDark ? "Dark theme active" : "Light theme active"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                />
              </div>

              {/* Timezone Setting */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <Globe className="w-5 h-5 text-brown-300" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-brown-100">Timezone</p>
                      <p className="text-xs text-brown-500">
                        {detectionMethod === "auto" ? "Auto-detected" : "Manual"} &middot; {getTimezoneAbbreviation()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brown-500">Auto</span>
                    <Switch
                      checked={detectionMethod === "auto"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          resetToAutoDetect();
                          setShowTzPicker(false);
                        } else {
                          setManualTimezone(timezone);
                          setShowTzPicker(true);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Timezone selector - shown when manual */}
                {detectionMethod === "manual" && (
                  <div className="ml-12">
                    <button
                      onClick={() => setShowTzPicker(!showTzPicker)}
                      className="w-full flex items-center justify-between p-3 bg-brown-700/40 border border-brown-600/50 rounded-lg hover:border-gold-400/30 transition-colors"
                    >
                      <span className="text-sm text-brown-200">{getTimezoneLabel()}</span>
                      <ChevronDown className={`w-4 h-4 text-brown-400 transition-transform ${showTzPicker ? "rotate-180" : ""}`} />
                    </button>

                    {showTzPicker && (
                      <div className="mt-2 max-h-48 overflow-y-auto bg-brown-800 border border-brown-600/50 rounded-lg">
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <button
                            key={tz.value}
                            onClick={() => {
                              setManualTimezone(tz.value);
                              setShowTzPicker(false);
                            }}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-brown-700/50 transition-colors"
                          >
                            <span className="text-sm text-brown-200">{tz.label}</span>
                            {timezone === tz.value && (
                              <Check className="w-4 h-4 text-gold-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications Setting */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <Bell className="w-5 h-5 text-brown-300" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-brown-100">Notifications</p>
                      <p className="text-xs text-brown-500">
                        {notifEnabled ? "Daily trade reminders on" : "Alerts and reminders"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifEnabled}
                    disabled={notifLoading || notifPermissionDenied}
                    onCheckedChange={handleNotifToggle}
                  />
                </div>

                {notifPermissionDenied && (
                  <div className="ml-12 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-400">
                      Notifications are blocked by your browser. Enable them in your browser settings to use this feature.
                    </p>
                  </div>
                )}

                {notifEnabled && (
                  <div className="ml-12 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-brown-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Reminder Time</span>
                    </div>
                    <button
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className="w-full flex items-center justify-between p-3 bg-brown-700/40 border border-brown-600/50 rounded-lg hover:border-gold-400/30 transition-colors"
                    >
                      <span className="text-sm text-brown-200">
                        {REMINDER_TIME_OPTIONS.find((t) => t.value === reminderTime)?.label || reminderTime}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-brown-400 transition-transform ${showTimePicker ? "rotate-180" : ""}`} />
                    </button>

                    {showTimePicker && (
                      <div className="max-h-48 overflow-y-auto bg-brown-800 border border-brown-600/50 rounded-lg">
                        {REMINDER_TIME_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleTimeChange(option.value)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-brown-700/50 transition-colors"
                          >
                            <span className="text-sm text-brown-200">{option.label}</span>
                            {reminderTime === option.value && (
                              <Check className="w-4 h-4 text-gold-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Other preference items */}
              {preferencesOtherItems.map((item) => {
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
                    <ChevronRight className="w-4 h-4 text-brown-500" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <div>
          <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">SUPPORT</h2>
          <div className="space-y-3">
            {/* Contact Support */}
            <Card className="bg-brown-800/50 border-brown-700">
              <CardContent className="p-0">
                <button
                  onClick={handleContactSupport}
                  className="w-full flex items-center justify-between p-4 hover:bg-brown-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <Mail className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-brown-100">Contact Support</p>
                      <p className="text-xs text-brown-500">gainsview@gmail.com</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brown-500" />
                </button>
              </CardContent>
            </Card>

            {/* FAQ — single collapsible container */}
            <Card className="bg-brown-800/50 border-brown-700 overflow-hidden">
              <CardContent className="p-0">
                <button
                  onClick={() => setFaqOpen(!faqOpen)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-gold-400" />
                    </div>
                    <span className="font-medium text-brown-100">Frequently Asked Questions</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-brown-500 transition-transform ${faqOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {faqOpen && (
                  <div className="border-t border-brown-700/50">
                    {faqs.map((faq, index) => (
                      <div
                        key={faq.id}
                        className={index !== faqs.length - 1 ? "border-b border-brown-700/50" : ""}
                      >
                        <button
                          onClick={() => setOpenQuestion(openQuestion === faq.id ? null : faq.id)}
                          className="w-full flex items-start justify-between p-4 text-left"
                        >
                          <span className="text-sm text-brown-100 pr-4">{faq.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-brown-500 shrink-0 mt-0.5 transition-transform ${
                              openQuestion === faq.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {openQuestion === faq.id && (
                          <div className="px-4 pb-4">
                            <p className="text-sm text-brown-400 bg-brown-900/50 p-3 rounded-lg">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Bug & Feature Request */}
            <Card className="bg-brown-800/50 border-brown-700">
              <CardContent className="p-0 divide-y divide-brown-700/50">
                <button
                  onClick={handleReportBug}
                  className="w-full flex items-center justify-between p-4 hover:bg-brown-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <Bug className="w-5 h-5 text-gold-400" />
                    </div>
                    <span className="font-medium text-brown-100">Report a Bug</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brown-500" />
                </button>
                <button
                  onClick={handleFeatureRequest}
                  className="w-full flex items-center justify-between p-4 hover:bg-brown-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-gold-400" />
                    </div>
                    <span className="font-medium text-brown-100">Request a Feature</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brown-500" />
                </button>
              </CardContent>
            </Card>

            {/* Have additional questions? */}
            <div className="p-4 bg-gold-400/10 border border-gold-400/30 rounded-xl text-center">
              <p className="text-brown-100 font-medium mb-1">
                Have additional questions?
              </p>
              <button
                onClick={handleContactSupport}
                className="text-gold-400 font-medium hover:underline"
              >
                Reach out to us &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Legal Section */}
        <MenuSection title="LEGAL" items={legalItems} />

        {/* Security Modal */}
        {showSecurityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-brown-900 border border-brown-700 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-brown-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Shield className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-brown-50">Security</h2>
                    <p className="text-xs text-brown-400">Manage your account security</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSecurityModal(false)}
                  className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-brown-400">
                  Need to reset your password? Send us a request and we&apos;ll help you get back into your account.
                </p>
                <button
                  onClick={() => {
                    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
                    const emailBody = userEmail
                      ? `Hi GainsView Support,%0D%0A%0D%0AI would like to reset my password.%0D%0A%0D%0AAccount email: ${encodeURIComponent(userEmail)}%0D%0A%0D%0AThank you`
                      : `Hi GainsView Support,%0D%0A%0D%0AI would like to reset my password.%0D%0A%0D%0AAccount email: [please enter your account email]%0D%0A%0D%0AThank you`;
                    window.location.href = `mailto:gainsview@gmail.com?subject=Password%20Reset%20Request&body=${emailBody}`;
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gold-500 text-brown-900 font-semibold rounded-xl hover:bg-gold-600 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Request Password Reset
                </button>
                <p className="text-xs text-center text-brown-500">
                  This will open your email app to contact our support team
                </p>
              </div>
            </div>
          </div>
        )}

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
          <p>GainsView v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
