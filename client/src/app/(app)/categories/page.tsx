"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Category, CategorySpending } from "@/lib/types";
import { categoryColor } from "@/lib/constants";
import { currencySymbol, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartTooltip } from "@/components/charts";

export default function CategoriesPage() {
  const { user } = useAuth();
  const currency = user?.defaultCurrency || "USD";
  const sym = currencySymbol(currency);

  const [categories, setCategories] = useState<Category[]>([]);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ categories: Category[] }>("/categories"),
      api<{ categories: CategorySpending[] }>("/categories/spending"),
    ])
      .then(([catRes, spendRes]) => {
        setCategories(catRes.categories);
        setSpending(spendRes.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Categories" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const spendMap = new Map(spending.map((s) => [s.category, s]));
  const totalSpent = spending.reduce((sum, s) => sum + s.total, 0);

  const chartData = spending.slice(0, 10).map((s) => ({
    name: s.category,
    total: s.total,
    color: categoryColor(s.category),
  }));

  const categoryRows = categories.map((c) => {
    const sp = spendMap.get(c.name);
    const count = sp?.count ?? 0;
    const total = sp?.total ?? 0;
    const percent = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
    return { ...c, count, total, percent };
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Your spending broken down by category"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickFormatter={(v) => `${sym}${v}`}
                      width={56}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="total" name="Spent" radius={[4, 4, 0, 0]}>
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No spending recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All categories</CardTitle>
            <CardDescription>Totals and counts per category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryRows.map((row) => (
              <div key={row.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-medium">{row.name}</span>
                    {row.count > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {row.count} expense{row.count === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-medium">
                    {row.total > 0
                      ? formatCurrency(row.total, currency)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(row.percent, 100)}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                  {row.total > 0 ? (
                    <span className="w-10 text-right text-xs text-muted-foreground">
                      {row.percent.toFixed(0)}%
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}