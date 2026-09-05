"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Category, RecurringExpense } from "@/lib/types";
import { categoryColor } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RecurringFormDialog } from "@/components/recurring-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function RecurringPage() {
  const { user } = useAuth();
  const currency = user?.defaultCurrency || "USD";

  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [processing, setProcessing] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [deleting, setDeleting] = useState<RecurringExpense | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api<{ recurring: RecurringExpense[] }>("/recurring")
      .then((res) => setItems(res.recurring))
      .catch(() => toast.error("Could not load recurring expenses"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api(`/recurring/${deleting._id}`, { method: "DELETE" });
      toast.success("Recurring expense deleted");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    try {
      await api(`/recurring/${item._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !item.active }),
      });
      toast.success(item.active ? "Recurring expense paused" : "Recurring expense resumed");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not update status"
      );
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await api<{ generated: number }>("/recurring/process", {
        method: "POST",
      });
      if (res.generated > 0) {
        toast.success(`${res.generated} expense(s) generated`);
      } else {
        toast.info("No recurring expenses are due right now");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Automatic expenses that repeat on a schedule"
        actions={
          <>
            <Button variant="outline" onClick={handleProcess} disabled={processing}>
              <Play className="size-4" />
              {processing ? "Processing..." : "Process due"}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Add recurring
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="px-0">
          {loading && !items.length ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: categoryColor(item.category),
                          }}
                        />
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">
                      {item.frequency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.nextDueDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.active ? "default" : "secondary"}
                      >
                        {item.active ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(item);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(item)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No recurring expenses yet. Add a subscription, rent or other
              regular payment.
            </p>
          )}
        </CardContent>
      </Card>

      {formOpen ? (
        <RecurringFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          categories={categories}
          item={editing}
          onSaved={refresh}
        />
      ) : null}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete recurring expense"
        description={
          deleting
            ? `Are you sure you want to delete "${deleting.description}"? This will not delete expenses already generated.`
            : ""
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}