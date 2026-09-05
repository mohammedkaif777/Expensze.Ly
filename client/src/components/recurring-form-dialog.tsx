"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Category, RecurringExpense } from "@/lib/types";
import { FREQUENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecurringFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  item?: RecurringExpense | null;
  onSaved: () => void;
}

export function RecurringFormDialog({
  open,
  onOpenChange,
  categories,
  item,
  onSaved,
}: RecurringFormDialogProps) {
  const [description, setDescription] = useState(item?.description ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [frequency, setFrequency] = useState<string>(item?.frequency ?? "monthly");
  const [nextDueDate, setNextDueDate] = useState(
    item?.nextDueDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        description,
        amount: parseFloat(amount),
        category,
        frequency,
        nextDueDate: new Date(nextDueDate).toISOString(),
      };
      if (item) {
        await api(`/recurring/${item._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Recurring expense updated");
      } else {
        await api("/recurring", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Recurring expense created");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not save recurring expense"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit recurring expense" : "Add recurring expense"}
          </DialogTitle>
          <DialogDescription>
            Recurring expenses are automatically added as normal expenses when
            they become due.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recurring-description">Description</Label>
            <Input
              id="recurring-description"
              placeholder="e.g. Netflix subscription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurring-amount">Amount</Label>
              <Input
                id="recurring-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recurring-date">Next due date</Label>
            <Input
              id="recurring-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
            />
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
              {loading
                ? "Saving..."
                : item
                ? "Save changes"
                : "Add recurring expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}