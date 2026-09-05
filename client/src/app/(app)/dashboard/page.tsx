"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
      <p className="text-muted-foreground">
        The dashboard is under construction.
      </p>
      <Button variant="outline" onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}