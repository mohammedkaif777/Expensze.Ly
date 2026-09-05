"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { currencySymbol, formatCurrency } from "@/lib/utils";

const CACHE_TTL = 6 * 60 * 60 * 1000;

interface RateData {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const cache: { data: RateData | null; at: number } = { data: null, at: 0 };

async function fetchRates(force = false): Promise<RateData> {
  const now = Date.now();
  if (!force && cache.data && now - cache.at < CACHE_TTL) {
    return cache.data;
  }
  const res = await fetch("/api/rates", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load rates");
  const data: RateData = await res.json();
  cache.data = data;
  cache.at = now;
  return data;
}

/**
 * Converts amounts stored in USD to the user's preferred currency (live rate).
 * Falls back to 1:1 when rates haven't loaded yet to avoid crash / NaN.
 */
export function useCurrency() {
  const { user } = useAuth();
  const currency = user?.defaultCurrency || "USD";
  const [state, setState] = useState<{ code: string; rate: number | null }>(
    () =>
      currency === "USD"
        ? { code: "USD", rate: 1 }
        : { code: "", rate: null }
  );

  useEffect(() => {
    if (currency === "USD") return;
    let ignore = false;
    fetchRates()
      .then((data) => {
        const r = data.rates[currency];
        if (ignore || typeof r !== "number") return;
        setState({ code: currency, rate: r });
      })
      .catch(() => {
        if (ignore) return;
        setState({ code: currency, rate: 1 });
      });
    return () => {
      ignore = true;
    };
  }, [currency]);

  const stale = state.code !== currency;
  const effectiveRate = stale
    ? currency === "USD"
      ? 1
      : null
    : state.rate;
  const ready = effectiveRate !== null;
  const rate = effectiveRate ?? 1;

  const convert = useCallback(
    (usd: number) => usd * rate,
    [rate]
  );
  const format = useCallback(
    (usd: number) => formatCurrency(usd * rate, currency),
    [currency, rate]
  );

  return {
    currency,
    sym: currencySymbol(currency),
    rate,
    ready,
    convert,
    format,
  };
}

export { fetchRates };