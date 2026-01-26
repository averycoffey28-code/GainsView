"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  Search,
  Download,
  RefreshCw,
  Mail,
  Calendar,
  Shield,
  Loader2,
  Crown,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ClerkUser {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: number;
  lastSignInAt: number | null;
  externalAccounts: { provider: string }[];
}

export default function AdminUsersPage() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ClerkUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      setError("Failed to load users. Make sure you have admin access.");
      console.error(err);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter((user) => {
        const email = user.emailAddresses[0]?.emailAddress || "";
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        return (
          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const exportToCSV = () => {
    const headers = ["Email", "Name", "Provider", "Created At", "Last Sign In"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [
          user.emailAddresses[0]?.emailAddress || "",
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          user.externalAccounts[0]?.provider || "email",
          new Date(user.createdAt).toISOString(),
          user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : "",
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

  const getProviderBadge = (user: ClerkUser) => {
    const provider = user.externalAccounts[0]?.provider;
    switch (provider) {
      case "google":
        return <Badge className="bg-blue-500/20 text-blue-400 border-0">Google</Badge>;
      case "apple":
        return <Badge className="bg-gray-500/20 text-gray-300 border-0">Apple</Badge>;
      default:
        return <Badge className="bg-brown-600/50 text-brown-300 border-0">Email</Badge>;
    }
  };

  const thisWeekUsers = users.filter((u) => {
    const created = new Date(u.createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const googleUsers = users.filter(
    (u) => u.externalAccounts[0]?.provider === "google"
  ).length;

  return (
    <div className="min-h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 md:p-8">
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

        {/* Clerk Dashboard Link */}
        <Card className="bg-gold-500/10 border-gold-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-brown-100 font-medium">Full User Management</p>
              <p className="text-sm text-brown-400">
                Use Clerk Dashboard for advanced user management, banning, and more.
              </p>
            </div>
            <Button
              onClick={() => window.open("https://dashboard.clerk.com", "_blank")}
              variant="outline"
              className="border-gold-500/50 text-gold-400 hover:bg-gold-500/20"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Clerk
            </Button>
          </CardContent>
        </Card>

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
                  <p className="text-2xl font-bold text-brown-50">0</p>
                  <p className="text-xs text-brown-400">Premium</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-brown-50">{thisWeekUsers}</p>
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
                  <p className="text-2xl font-bold text-brown-50">{googleUsers}</p>
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

        {/* Error Message */}
        {error && (
          <Card className="bg-rose-500/10 border-rose-500/30">
            <CardContent className="p-4">
              <p className="text-rose-400">{error}</p>
            </CardContent>
          </Card>
        )}

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
                        Last Sign In
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
                            {user.imageUrl ? (
                              <img
                                src={user.imageUrl}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-brown-700 flex items-center justify-center">
                                <span className="text-brown-300 font-medium">
                                  {user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-brown-100">
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                  : "No name"}
                              </p>
                              <p className="text-sm text-brown-400">
                                {user.emailAddresses[0]?.emailAddress}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{getProviderBadge(user)}</td>
                        <td className="p-4 text-sm text-brown-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-brown-300">
                          {user.lastSignInAt
                            ? new Date(user.lastSignInAt).toLocaleDateString()
                            : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
