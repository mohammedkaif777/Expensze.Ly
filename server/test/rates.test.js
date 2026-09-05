import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRates, getRateHistory, convert, clearRatesCache } from '../src/utils/rates.js';
import { buildInsight } from '../src/utils/advice.js';

const mockRatesResponse = {
  date: '2026-09-05',
  rates: { EUR: 0.91, GBP: 0.77, INR: 84.2, AUD: 1.52, CAD: 1.37, JPY: 152.3 },
};

const mockFetch = (url) => {
  const s = String(url);
  if (s.includes('/latest')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockRatesResponse),
    });
  }
  if (s.includes('..')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          rates: {
            '2026-08-20': { INR: 82.5 },
            '2026-09-05': { INR: 84.2 },
          },
        }),
    });
  }
  return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
};

test('getRates maps USD to 1 and caches', async () => {
  clearRatesCache();
  const data = await getRates(mockFetch);
  assert.equal(data.rates.USD, 1);
  assert.equal(data.rates.INR, 84.2);
  const again = await getRates(mockFetch);
  assert.equal(again, data); // served from cache (same reference)
});

test('getRates re-fetches after cache clear', async () => {
  clearRatesCache();
  const data = await getRates(mockFetch);
  assert.equal(data.rates.JPY, 152.3);
  clearRatesCache();
  const fresh = await getRates(mockFetch);
  assert.notEqual(fresh, data);
});

test('getRateHistory returns oldest-first series', async () => {
  clearRatesCache();
  const series = await getRateHistory('INR', mockFetch);
  assert.ok(series.length >= 2);
  assert.ok(series[0].date < series[series.length - 1].date);
  assert.equal(series[series.length - 1].value, 84.2);
});

test('getRateHistory returns [] for USD', async () => {
  clearRatesCache();
  const series = await getRateHistory('USD', mockFetch);
  assert.deepEqual(series, []);
});

test('convert converts USD to INR', async () => {
  clearRatesCache();
  const value = await convert(100, 'USD', 'INR', mockFetch);
  assert.equal(value, 100 * 84.2);
});

test('convert is identity for same currency', async () => {
  const value = await convert(42.5, 'USD', 'USD', mockFetch);
  assert.equal(value, 42.5);
});

test('buildInsight detects depreciation with rising units-per-USD', () => {
  const series = [
    { date: '2026-08-20', value: 82 },
    { date: '2026-08-27', value: 83 },
    { date: '2026-09-05', value: 84.2 },
  ];
  const insight = buildInsight(84.2, series);
  assert.equal(insight.trend, 'depreciating');
  assert.equal(insight.strength, 'weak');
  assert.ok(insight.advice.length > 0);
  assert.ok(insight.investments.length > 0);
  assert.ok(insight.summary.includes('weakened'));
});

test('buildInsight detects appreciation', () => {
  const series = [
    { date: '2026-08-20', value: 84.2 },
    { date: '2026-09-05', value: 82 },
  ];
  const insight = buildInsight(82, series);
  assert.equal(insight.strength, 'strong');
  assert.equal(insight.trend, 'appreciating');
});

test('buildInsight returns null for invalid rate', () => {
  assert.equal(buildInsight(0), null);
});