"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Search,
  Download,
  RefreshCw,
  Mail,
  Calendar,
  Shield,
  MoreVertical,
  Key,
  StickyNote,
  X,
  Save,
  Loader2,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  created_at: string;
  last_login: string | null;
  subscription_status: string | null;
  admin_notes: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
      setFilteredUsers(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const exportToCSV = () => {
    const headers = ["Email", "Name", "Auth Provider", "Created At", "Last Login", "Subscription", "Notes"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [
          user.email,
          user.full_name || "",
          user.auth_provider,
          user.created_at,
          user.last_login || "",
          user.subscription_status || "free",
          (user.admin_notes || "").replace(/,/g, ";"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gainsview-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      alert("Error sending reset email: " + error.message);
    } else {
      alert("Password reset email sent to " + email);
    }
  };

  const saveNotes = async () => {
    if (!selectedUser) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ admin_notes: notes })
      .eq("id", selectedUser.id);

    if (!error) {
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, admin_notes: notes } : u)));
      setSelectedUser(null);
    }
    setIsSaving(false);
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "google":
        return <Badge className="bg-blue-500/20 text-blue-400 border-0">Google</Badge>;
      case "apple":
        return <Badge className="bg-gray-500/20 text-gray-300 border-0">Apple</Badge>;
      default:
        return <Badge className="bg-brown-600/50 text-brown-300 border-0">Email</Badge>;
    }
  };

  const getSubscriptionBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Active</Badge>;
      case "trial":
        return <Badge className="bg-gold-500/20 text-gold-400 border-0">Trial</Badge>;
      case "canceled":
        return <Badge className="bg-rose-500/20 text-rose-400 border-0">Canceled</Badge>;
      default:
        return <Badge className="bg-brown-600/50 text-brown-400 border-0">Free</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-400/20 rounded-xl">
              <Shield className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brown-50">Admin Dashboard</h1>
              <p className="text-sm text-brown-400">User Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchUsers}
              variant="ghost"
              className="text-brown-400 hover:text-brown-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="bg-gold-500 hover:bg-gold-600 text-brown-900">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-gold-400" />
                <div>
                  <p className="text-2xl font-bold text-brown-50">{users.length}</p>
                  <p className="text-xs text-brown-400">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-brown-50">
                    {users.filter((u) => u.subscription_status === "active").length}
                  </p>
                  <p className="text-xs text-brown-400">Active Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-brown-50">
                    {users.filter((u) => {
                      const created = new Date(u.created_at);
                      const now = new Date();
                      const diff = now.getTime() - created.getTime();
                      return diff < 7 * 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                  <p className="text-xs text-brown-400">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-rose-400" />
                <div>
                  <p className="text-2xl font-bold text-brown-50">
                    {users.filter((u) => u.auth_provider === "google").length}
                  </p>
                  <p className="text-xs text-brown-400">Google Auth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-500" />
          <Input
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-brown-800/50 border-brown-700 text-brown-100 py-6"
          />
        </div>

        {/* Users Table */}
        <Card className="bg-brown-800/50 border-brown-700 overflow-hidden">
          <CardHeader className="border-b border-brown-700">
            <CardTitle className="text-brown-100 text-lg">
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-brown-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brown-700 bg-brown-900/50">
                      <th className="text-left p-4 text-xs text-brown-400 font-medium uppercase">
                        User
                      </th>
                      <th className="text-left p-4 text-xs text-brown-400 font-medium uppercase">
                        Provider
                      </th>
                      <th className="text-left p-4 text-xs text-brown-400 font-medium uppercase">
                        Joined
                      </th>
                      <th className="text-left p-4 text-xs text-brown-400 font-medium uppercase">
                        Last Login
                      </th>
                      <th className="text-left p-4 text-xs text-brown-400 font-medium uppercase">
                        Status
                      </th>
                      <th className="text-right p-4 text-xs text-brown-400 font-medium uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-brown-700/50 hover:bg-brown-700/20 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-brown-700 flex items-center justify-center">
                                <span className="text-brown-300 font-medium">
                                  {user.email?.[0]?.toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-brown-100">
                                {user.full_name || "No name"}
                              </p>
                              <p className="text-sm text-brown-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{getProviderBadge(user.auth_provider)}</td>
                        <td className="p-4 text-sm text-brown-300">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-brown-300">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="p-4">{getSubscriptionBadge(user.subscription_status)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendPasswordReset(user.email)}
                              className="text-brown-400 hover:text-brown-200 h-8 w-8"
                              title="Send password reset"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setNotes(user.admin_notes || "");
                              }}
                              className="text-brown-400 hover:text-brown-200 h-8 w-8"
                              title="Add notes"
                            >
                              <StickyNote className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-brown-900 border-brown-700">
              <CardHeader className="flex flex-row items-center justify-between border-b border-brown-700">
                <CardTitle className="text-brown-100">Admin Notes</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  className="text-brown-400 hover:text-brown-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-brown-400 mb-1">User</p>
                  <p className="text-brown-100">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-brown-400 mb-2">Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this user (support tickets, issues, etc.)"
                    className="w-full h-32 p-3 bg-brown-800 border border-brown-700 rounded-lg text-brown-100 placeholder:text-brown-500 resize-none"
                  />
                </div>
                <Button
                  onClick={saveNotes}
                  disabled={isSaving}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-brown-900"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Notes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
