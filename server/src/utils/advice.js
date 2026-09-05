const RATE_NOTES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
};

export const currencyNote = (code) =>
  RATE_NOTES[code] || { symbol: code, name: code };

/**
 * Build a currency-vs-USD market insight.
 * @param {number} rate  units of `to` per 1 USD
 * @param {Array<{date, value}>} history  daily USD->code series, oldest first
 * @returns {{strength, trend, pctChange, summary, advice, investments}}
 */
export const buildInsight = (rate, history = []) => {
  if (!rate || rate <= 0) return null;

  let trend = 'flat';
  let pctChange = 0;
  if (history.length >= 2) {
    const first = history[0].value;
    const last = history[history.length - 1].value;
    if (first > 0) {
      pctChange = ((last - first) / first) * 100;
      trend = pctChange > 1 ? 'depreciating' : pctChange < -1 ? 'appreciating' : 'flat';
    }
  }

  // strength: units-per-USD low -> local currency is strong.
  let strength = 'neutral';
  if (trend === 'depreciating') strength = 'weak';
  else if (trend === 'appreciating') strength = 'strong';

  const advice = buildAdvice(strength, pctChange);
  const investments = buildInvestments(strength);

  return { strength, trend, pctChange, summary: buildSummary(strength), advice, investments };
};

const buildSummary = (strength) => {
  switch (strength) {
    case 'weak':
      return 'Your currency has weakened against the USD recently — imported and USD-linked costs will feel pricier.';
    case 'strong':
      return 'Your currency has strengthened against the USD — imported and USD-priced purchases are comparatively cheaper right now.';
    default:
      return 'Your currency has been broadly stable against the USD.';
  }
};

const buildAdvice = (strength, pctChange) => {
  if (strength === 'weak') {
    return [
      'Cut or pause subscriptions billed in USD (streaming, SaaS) — they are effectively costing you more in local terms.',
      'Delay big imports: electronics, international travel and imported groceries are pricier while your currency is weak.',
      'Reprice your exchange-rate-sensitive bills now, and renegotiate contracts priced in USD if possible.',
      'Keep a slightly larger cash buffer locally to absorb volatility in essential categories like food and transport.',
    ];
  }
  if (strength === 'strong') {
    return [
      'Good window to schedule USD-denominated purchases (electronics, travel, SaaS) while they are cheaper in your currency.',
      'Pay down any USD-linked loans or obligations — a strong currency makes them cheaper to settle.',
      'Reasonable time to lock in multi-month subscriptions priced in USD before the window closes.',
      'Essential categories (food, transport, housing) call for no discipline change — your buying power is fine.',
    ];
  }
  return [
    'Watch FX volatility before committing to large USD-priced purchases.',
    'Review USD-linked recurring subscriptions and negotiate multi-month rates when rates are favorable.',
    'Stick to budgets for imported/expensive categories; re-review monthly as rates move.',
  ];
};

const buildInvestments = (strength) => {
  if (strength === 'weak') {
    return [
      'Shift spare cash toward inflation-protected assets (index funds, gold/sovereign bonds) — cash is losing value faster in a weak currency.',
      'Consider rupee-cost-averaging into diversified equity/ETF regularly instead of lump-sum timing.',
      'Keep only a small emergency buffer in the weakening local currency; park the rest in earning assets.',
    ];
  }
  if (strength === 'strong') {
    return [
      'A stable-to-strong currency is a good time to build a diversified equity + bond allocation.',
      'Add international exposure while your currency gives you extra buying power abroad.',
      'Avoid over-concentrating in a single asset class — keep routine SIPs automated.',
    ];
  }
  return [
    'Maintain an automated, diversified investment plan regardless of FX moves.',
    'Use stop-loss discipline on discretionary trading; long-term indexing tends to outperform timing.',
    'Rebalance once per quarter rather than reacting to daily FX swings.',
  ];
};