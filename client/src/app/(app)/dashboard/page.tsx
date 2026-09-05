"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  ReceiptText,
  Repeat,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DashboardData } from "@/lib/types";
import { currencySymbol, formatCurrency, formatDate } from "@/lib/utils";
import { categoryColor } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChartTooltip } from "@/components/charts";

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  subPositive,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  subPositive?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardDescription>{label}</CardDescription>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {sub ? (
          <p
            className={`mt-1 flex items-center gap-1 text-xs ${
              subPositive === undefined
                ? "text-muted-foreground"
                : subPositive
                ? "text-green-600 dark:text-green-500"
                : "text-destructive"
            }`}
          >
            {subPositive !== undefined ? (
              subPositive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )
            ) : null}
            {sub}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const currency = user?.defaultCurrency || "USD";
  const sym = currencySymbol(currency);

  useEffect(() => {
    api<DashboardData>("/dashboard")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Could not load dashboard. Make sure the backend is running.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const months = data.monthlySpend.map((m) => m.total);

  const monthData = data.monthlySpend.map((m) => {
    const [year, month] = m._id.split("-");
    return {
      month: new Date(Number(year), Number(month) - 1).toLocaleString(
        "en-US",
        { month: "short" }
      ),
      total: m.total,
    };
  });

  const maxTotal = Math.max(...months, 1);

  const catData = data.byCategory.map((c) => ({
    name: c.category,
    value: c.total,
    color: categoryColor(c.category),
  }));

  const changePositive = (data.metrics.change ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Here's what's happening with your money in ${new Date().toLocaleString("en-US", { month: "long" })}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spent this month"
          value={formatCurrency(data.metrics.currentTotal, currency)}
          icon={Wallet}
          sub={
            data.metrics.change !== null
              ? `${changePositive ? "+" : ""}${data.metrics.change}% vs last month`
              : "vs last month"
          }
          subPositive={data.metrics.change !== null ? !changePositive : undefined}
        />
        <StatCard
          label="Expenses"
          value={String(data.metrics.currentCount)}
          icon={ReceiptText}
          sub={`vs ${data.metrics.prevCount} last month`}
        />
        <StatCard
          label="Recurring (monthly)"
          value={formatCurrency(data.recurring.monthlyTotal, currency)}
          icon={Repeat}
          sub={`${data.recurring.items} active`}
        />
        <StatCard
          label="Budget status"
          value={
            data.budgetSummary.length
              ? `${data.budgetSummary.filter((b) => b.status !== "exceeded").length}/${data.budgetSummary.length} on track`
              : "No budgets"
          }
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Spending trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(v) => `${sym}${v}`}
                    width={48}
                    domain={[0, maxTotal * 1.2]}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Spending"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#spendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            {catData.length ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        stroke="var(--background)"
                      >
                        {catData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1.5">
                  {catData.slice(0, 5).map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(c.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No spending recorded this month
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentExpenses.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentExpenses.map((e) => (
                    <TableRow key={e._id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(e.date)}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: categoryColor(e.category) }}
                          />
                          {e.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(e.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expenses yet. Add your first expense.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Monthly progress vs limits</CardDescription>
          </CardHeader>
          <CardContent>
            {data.budgetSummary.length ? (
              <div className="space-y-5">
                {data.budgetSummary.map((b) => (
                  <div key={b.category}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{b.category}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(b.spent, currency)} /{" "}
                        {formatCurrency(b.monthlyLimit, currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress
                          value={Math.min(b.percent, 100)}
                          className={
                            b.status === "exceeded"
                              ? "[&>div]:bg-destructive"
                              : b.status === "warning"
                              ? "[&>div]:bg-yellow-500"
                              : undefined
                          }
                        />
                      </div>
                      <Badge
                        variant={
                          b.status === "exceeded"
                            ? "destructive"
                            : b.status === "warning"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {b.percent}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  No budgets set for this month.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/budgets">Set a budget</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}