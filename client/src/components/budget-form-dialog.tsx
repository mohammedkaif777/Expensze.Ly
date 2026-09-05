"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  categories: Category[];
  budget?: Budget | null;
  existingCategories: string[];
  onSaved: () => void;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  month,
  categories,
  budget,
  existingCategories,
  onSaved,
}: BudgetFormDialogProps) {
  const editing = Boolean(budget);
  const available = budget
    ? categories.filter(
        (c) => c.name === budget.category || !existingCategories.includes(c.name)
      )
    : categories.filter((c) => !existingCategories.includes(c.name));

  const [category, setCategory] = useState(budget?.category ?? "");
  const [monthlyLimit, setMonthlyLimit] = useState(
    budget ? String(budget.monthlyLimit) : ""
  );
  const [alertThreshold, setAlertThreshold] = useState(
    budget ? String(budget.alertThreshold) : "80"
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget && !category) {
      toast.error("Please select a category");
      return;
    }
    setLoading(true);
    try {
      if (budget) {
        await api(`/budgets/${budget.id}`, {
          method: "PUT",
          body: JSON.stringify({
            monthlyLimit: parseFloat(monthlyLimit),
            alertThreshold: parseFloat(alertThreshold),
          }),
        });
        toast.success("Budget updated");
      } else {
        await api("/budgets", {
          method: "POST",
          body: JSON.stringify({
            category,
            monthlyLimit: parseFloat(monthlyLimit),
            month,
            alertThreshold: parseFloat(alertThreshold),
          }),
        });
        toast.success("Budget created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Edit budget" : "Add budget"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the limit and alert threshold for this budget."
              : `Set a monthly spending limit for a category in ${month}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!budget ? (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {available.length ? (
                    available.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))
                  ) : (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      You already have budgets for all categories.
                    </p>
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="budget-limit">Monthly limit</Label>
            <Input
              id="budget-limit"
              type="number"
              min="1"
              step="0.01"
              placeholder="500"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-threshold">Alert threshold (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="budget-threshold"
                type="range"
                min="1"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="h-2 cursor-pointer appearance-none rounded-full bg-primary/20"
              />
              <span className="w-12 shrink-0 text-right text-sm font-medium">
                {alertThreshold}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll see a warning once spending crosses this percent of your
              limit.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : budget ? "Save changes" : "Add budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}