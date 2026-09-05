"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface HistoricalPoint {
  date: string;
  value: number;
}

interface Insight {
  strength: string;
  trend: string;
  pctChange: number;
  summary: string;
  advice: string[];
  investments: string[];
}

interface InsightResponse {
  code: string;
  rate: number;
  historical: HistoricalPoint[];
  note: { symbol: string; name: string };
  insight: Insight | null;
}

function Sparkline({ data }: { data: { value: number }[] }) {
  if (!data.length) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = 100;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * pts;
      const y = 28 - ((v - min) / range) * 24 - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const color =
    values[values.length - 1] < values[0]
      ? "var(--green-600, #16a34a)"
      : values[values.length - 1] > values[0]
      ? "var(--destructive)"
      : "var(--muted-foreground)";
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function CurrencyInsights({ currency }: { currency: string }) {
  const [data, setData] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (currency === "USD") return;
    let ignore = false;
    api<InsightResponse>(`/rates/insight?to=${currency}`)
      .then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [currency]);

  if (currency === "USD") return null;

  const insight = data?.insight ?? null;
  const strength = insight?.strength ?? "neutral";
  const trend = insight?.trend ?? "flat";
  const change = insight?.pctChange ?? 0;
  const changePositive = change >= 0;

  const badgeVariant =
    strength === "strong"
      ? "default"
      : strength === "weak"
      ? "destructive"
      : "outline";

  const TrendIcon =
    trend === "appreciating"
      ? TrendingUp
      : trend === "depreciating"
      ? TrendingDown
      : Minus;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Currency & Market
        </CardTitle>
        <CardDescription>USD vs your currency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : failed || !insight ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {failed
              ? "Market data unavailable. Check your internet connection."
              : "Market data unavailable."}
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  1 USD = {data!.note.symbol}
                  {data!.rate.toFixed(2)} {data!.code}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendIcon className="size-3.5" />
                  {trend === "flat" ? "stable" : trend} vs USD
                  <span
                    className={
                      change === 0
                        ? "text-muted-foreground"
                        : changePositive
                        ? "text-destructive"
                        : "text-green-600 dark:text-green-500"
                    }
                  >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}% (30d)
                  </span>
                </p>
              </div>
              <Badge
                variant={badgeVariant}
                className={
                  strength === "strong"
                    ? "border-green-600/40 bg-green-600/10 text-green-600 dark:text-green-500"
                    : undefined
                }
              >
                {strength}
              </Badge>
            </div>

            <Sparkline data={data!.historical} />

            <p className="text-sm text-muted-foreground">{insight.summary}</p>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  {strength === "weak" ? (
                    <ArrowDownRight className="size-4 text-destructive" />
                  ) : strength === "strong" ? (
                    <ArrowUpRight className="size-4 text-green-600 dark:text-green-500" />
                  ) : (
                    <Minus className="size-4 text-muted-foreground" />
                  )}
                  Expenses
                </p>
                <ul className="space-y-1.5">
                  {insight.advice.map((a) => (
                    <li
                      key={a}
                      className="text-xs leading-relaxed text-muted-foreground"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="size-4 text-primary" />
                  Investments
                </p>
                <ul className="space-y-1.5">
                  {insight.investments.map((a) => (
                    <li
                      key={a}
                      className="text-xs leading-relaxed text-muted-foreground"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}