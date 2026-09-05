"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Category } from "@/lib/types";
import { categoryColor } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetFormDialog } from "@/components/budget-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
  alertThreshold: number;
  spent: number;
  percent: number;
  status: "exceeded" | "warning" | "ok";
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const currency = user?.defaultCurrency || "USD";
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [month, setMonth] = useState(currentMonthStr);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api<{ budgets: Budget[] }>(`/budgets?month=${month}`)
      .then((res) => setBudgets(res.budgets))
      .catch(() => toast.error("Could not load budgets"))
      .finally(() => setLoading(false));
  }, [month, refreshKey]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api(`/budgets/${deleting.id}`, { method: "DELETE" });
      toast.success("Budget deleted");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const isCurrentMonth = month === currentMonthStr;
  const existingCategories = budgets.map((b) => b.category);

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set monthly limits to keep spending in check"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add budget
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-40 text-center text-lg font-semibold">
          {monthLabel(month)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isCurrentMonth}
          onClick={() => setMonth(currentMonthStr)}
        >
          This month
        </Button>
      </div>

      {loading && !budgets.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : budgets.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: categoryColor(budget.category) }}
                  />
                  {budget.category}
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  {monthLabel(budget.month)}
                  <Badge
                    variant={
                      budget.status === "exceeded"
                        ? "destructive"
                        : budget.status === "warning"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {budget.status === "exceeded"
                      ? "Exceeded"
                      : budget.status === "warning"
                      ? "Warning"
                      : "On track"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatCurrency(budget.spent, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      spent of {formatCurrency(budget.monthlyLimit, currency)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {budget.percent}%
                  </span>
                </div>
                <Progress
                  value={Math.min(budget.percent, 100)}
                  className={
                    budget.status === "exceeded"
                      ? "[&>div]:bg-destructive"
                      : budget.status === "warning"
                      ? "[&>div]:bg-yellow-500"
                      : undefined
                  }
                />
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(budget);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(budget)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No budgets set for {monthLabel(month)}. Add one to start tracking
            spending limits.
          </CardContent>
        </Card>
      )}

      {formOpen ? (
        <BudgetFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          month={month}
          categories={categories}
          budget={editing}
          existingCategories={existingCategories}
          onSaved={refresh}
        />
      ) : null}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete budget"
        description={
          deleting
            ? `Are you sure you want to delete the budget for "${deleting.category}"? This action cannot be undone.`
            : ""
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}