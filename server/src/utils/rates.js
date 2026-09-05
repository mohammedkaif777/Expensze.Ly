import { CURRENCIES } from './constants.js';

const BASE_URL = 'https://api.frankfurter.app';
const TTL_MS = 6 * 60 * 60 * 1000;
const HISTORY_DAYS = 30;

let ratesCache = {
  data: null,
  fetchedAt: 0,
};

let historyCache = {};
let historyFetchedAt = 0;

export const normalize = (symbol) => ('' + symbol).toUpperCase();

const supportedRate = (symbol) => {
  const code = normalize(symbol);
  return CURRENCIES.includes(code) ? code : null;
};

const json = async (url, fetcher = fetch) => {
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`Rates request failed: ${res.status}`);
  return res.json();
};

const requestLatest = async (fetcher = fetch) => {
  const symbols = CURRENCIES.filter((c) => c !== 'USD').join(',');
  const data = await json(`${BASE_URL}/latest?from=USD&to=${symbols}`, fetcher);
  return {
    date: data.date,
    rates: { ...data.rates, USD: 1 },
  };
};

export const getRates = async (fetcher = fetch) => {
  const now = Date.now();
  if (ratesCache.data && now - ratesCache.fetchedAt < TTL_MS) {
    return ratesCache.data;
  }
  const data = await requestLatest(fetcher);
  ratesCache = { data, fetchedAt: now };
  return data;
};

export const convert = async (amount, from, to, fetcher = fetch) => {
  const fromCode = supportedRate(from);
  const toCode = supportedRate(to);
  if (!fromCode || !toCode) {
    throw new Error(`Unsupported currency: ${fromCode ? to : from}`);
  }
  if (fromCode === toCode) return amount;
  const { rates } = await getRates(fetcher);
  return amount * (rates[toCode] / rates[fromCode]);
};

/**
 * Fetch ~HISTORY_DAYS of daily USD -> to history from Frankfurter.
 * Returns [{ date, value }] oldest -> newest. Cached for TTL_MS.
 */
export const getRateHistory = async (to, fetcher = fetch) => {
  const code = supportedRate(to);
  if (!code || code === 'USD') return [];

  const now = Date.now();
  if (historyCache[code] && now - historyFetchedAt < TTL_MS) {
    return historyCache[code];
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - HISTORY_DAYS);

  const fmt = (d) => d.toISOString().slice(0, 10);
  const data = await json(
    `${BASE_URL}/${fmt(start)}..${fmt(end)}?from=USD&to=${code}`,
    fetcher
  );

  const series = Object.entries(data.rates || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rates]) => ({ date, value: rates[code] }));

  historyCache[code] = series;
  historyFetchedAt = now;
  return series;
};

export const getRateHistoryCached = getRateHistory;

export const clearRatesCache = () => {
  ratesCache = { data: null, fetchedAt: 0 };
  historyCache = {};
  historyFetchedAt = 0;
};