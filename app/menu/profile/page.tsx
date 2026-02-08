"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Camera,
  Mail,
  Lock,
  Calendar,
  User,
  Loader2,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please select an image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image must be less than 5MB", "error");
      return;
    }

    setUploading(true);
    try {
      await user.setProfileImage({ file });
      showMessage("Profile picture updated!", "success");
    } catch {
      showMessage("Failed to update profile picture", "error");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startEditingName = () => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setEditingName(true);
  };

  const cancelEditingName = () => {
    setEditingName(false);
  };

  const saveName = async () => {
    if (!user) return;
    setSavingName(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setEditingName(false);
      showMessage("Name updated!", "success");
    } catch {
      showMessage("Failed to update name", "error");
    } finally {
      setSavingName(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  const hasPassword = user?.passwordEnabled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-brown-700/50">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-brown-800/50 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-brown-300" />
        </button>
        <h1 className="text-lg font-semibold text-brown-50">Profile</h1>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`mx-4 mt-4 p-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center py-6">
          <div
            className="relative cursor-pointer group"
            onClick={handleAvatarClick}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold-400/30 bg-brown-800">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gold-400" />
                </div>
              )}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-brown-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-brown-50" />
            </div>

            {/* Uploading spinner */}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-brown-950/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
              </div>
            )}
          </div>

          <button
            onClick={handleAvatarClick}
            className="mt-3 text-sm text-gold-400 hover:text-gold-300 transition-colors"
          >
            Change Photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Account Information */}
        <div>
          <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">
            ACCOUNT INFORMATION
          </h2>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-0 divide-y divide-brown-700/50">
              {/* Name */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <User className="w-5 h-5 text-gold-400" />
                    </div>
                    <span className="text-sm text-brown-400">Name</span>
                  </div>
                  {!editingName && (
                    <button
                      onClick={startEditingName}
                      className="flex items-center gap-1 text-sm text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>

                {editingName ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-3">
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="bg-brown-700/50 border-brown-600 text-brown-50 placeholder:text-brown-500"
                      />
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="bg-brown-700/50 border-brown-600 text-brown-50 placeholder:text-brown-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEditingName}
                        className="px-3 py-1.5 text-sm text-brown-400 hover:text-brown-200 rounded-lg hover:bg-brown-700/50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={saveName}
                        disabled={savingName}
                        className="px-3 py-1.5 text-sm bg-gold-400/20 text-gold-400 rounded-lg hover:bg-gold-400/30 transition-colors disabled:opacity-50"
                      >
                        {savingName ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 ml-12 text-brown-100 font-medium">
                    {user?.fullName || "Not set"}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Mail className="w-5 h-5 text-gold-400" />
                  </div>
                  <span className="text-sm text-brown-400">Email</span>
                </div>
                <p className="mt-1 ml-12 text-brown-100 font-medium">
                  {user?.primaryEmailAddress?.emailAddress || "Not set"}
                </p>
              </div>

              {/* Password */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg">
                      <Lock className="w-5 h-5 text-gold-400" />
                    </div>
                    <span className="text-sm text-brown-400">Password</span>
                  </div>
                  {hasPassword && (
                    <button
                      onClick={() => {
                        // Clerk manages password changes through their hosted UI
                        // We can trigger it by redirecting to Clerk's user profile
                        window.open(
                          "https://accounts.clerk.dev/user",
                          "_blank"
                        );
                      }}
                      className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>
                <p className="mt-1 ml-12 text-brown-100 font-mono">
                  {hasPassword ? "••••••••••••" : "Sign in with social account"}
                </p>
              </div>

              {/* Member Since */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gold-400" />
                  </div>
                  <span className="text-sm text-brown-400">Member Since</span>
                </div>
                <p className="mt-1 ml-12 text-brown-100 font-medium">
                  {memberSince}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-sm font-medium text-rose-400/70 mb-3 px-1">
            DANGER ZONE
          </h2>
          <Card className="bg-brown-800/50 border-rose-500/20">
            <CardContent className="p-0">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete your account? This action cannot be undone."
                    )
                  ) {
                    user?.delete();
                    router.push("/sign-in");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-4 text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <span className="font-medium">Delete Account</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
