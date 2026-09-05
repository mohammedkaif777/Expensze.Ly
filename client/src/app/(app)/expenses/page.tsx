"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FilterX,
  Plus,
  Search,
} from "lucide-react";
import { api, ApiError, tokenStore } from "@/lib/api";
import { useCurrency } from "@/lib/use-currency";
import type { Category, Expense, ExpenseResponse } from "@/lib/types";
import { categoryColor } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseFormDialog } from "@/components/expense-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

const PAGE_SIZE = 12;

interface Filters {
  search: string;
  category: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  category: "all",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
};

export default function ExpensesPage() {
  const { format: fmt } = useCurrency();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ExpenseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exporting, setExporting] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const setFilter = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const loadCategories = useCallback(() => {
    api<{ categories: Category[] }>("/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.minAmount) params.set("minAmount", filters.minAmount);
    if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    let ignore = false;
    api<ExpenseResponse>(`/expenses?${params.toString()}`)
      .then((res) => {
        if (!ignore) setData(res);
      })
      .catch(() => {
        if (!ignore) toast.error("Could not load expenses");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [filters, page, refreshKey]);

  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);

    try {
      const token = tokenStore.get();
      const res = await fetch(
        `/api/dashboard/export?${params.toString()}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ApiError(
          body?.message || "Export failed",
          res.status
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Expenses exported");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api(`/expenses/${deleting._id}`, { method: "DELETE" });
      toast.success("Expense deleted");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const totalPages = data?.pagination.totalPages || 1;

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track and manage your spending"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="size-4" />{" "}
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Add expense
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => setFilter({ search: e.target.value })}
            />
          </div>
          <Select
            value={filters.category}
            onValueChange={(v) => setFilter({ category: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilter({ startDate: e.target.value })}
              aria-label="Start date"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilter({ endDate: e.target.value })}
              aria-label="End date"
            />
          </div>
          <div className="flex gap-2">
            <div className="grid flex-1 grid-cols-2 gap-2">
              <Input
                type="number"
                min="0"
                placeholder="Min"
                value={filters.minAmount}
                onChange={(e) => setFilter({ minAmount: e.target.value })}
                aria-label="Minimum amount"
              />
              <Input
                type="number"
                min="0"
                placeholder="Max"
                value={filters.maxAmount}
                onChange={(e) => setFilter({ maxAmount: e.target.value })}
                aria-label="Maximum amount"
              />
            </div>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="icon"
                aria-label="Clear filters"
                onClick={clearFilters}
              >
                <FilterX className="size-4" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {loading && !data ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data && data.expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{expense.description}</div>
                      {expense.notes ? (
                        <div className="text-xs text-muted-foreground">
                          {expense.notes}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: categoryColor(expense.category),
                          }}
                        />
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(expense);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(expense)}
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
              No expenses found. Add your first expense to get started.
            </p>
          )}

          {data && data.pagination.total > 0 ? (
            <div className="flex items-center justify-between border-t px-6 py-3 text-sm">
              <p className="text-muted-foreground">
                Showing{" "}
                {(data.pagination.page - 1) * data.pagination.limit + 1}–
                {Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )}{" "}
                of {data.pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {formOpen ? (
        <ExpenseFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          categories={categories}
          expense={editing}
          onSaved={refresh}
        />
      ) : null}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete expense"
        description={
          deleting
            ? `Are you sure you want to delete "${deleting.description}"? This action cannot be undone.`
            : ""
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}