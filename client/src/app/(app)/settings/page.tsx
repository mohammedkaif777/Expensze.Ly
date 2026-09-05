"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CURRENCIES } from "@/lib/constants";
import type { User } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [defaultCurrency, setDefaultCurrency] = useState(
    user?.defaultCurrency || "USD"
  );
  const [saving, setSaving] = useState(false);

  const dirty =
    name.trim() !== (user?.name || "") ||
    defaultCurrency !== (user?.defaultCurrency || "USD");

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const res = await api<{ user: User }>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), defaultCurrency }),
      });
      updateUser(res.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile and preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your display name, email and default currency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              Your email is used to sign in and cannot be changed.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Default currency</Label>
            <Select
              value={defaultCurrency}
              onValueChange={setDefaultCurrency}
            >
              <SelectTrigger id="currency" className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used to display your expenses, budgets and dashboard figures.
            </p>
          </div>
          <div>
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}