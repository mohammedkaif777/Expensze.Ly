import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getRates,
  getRateHistory,
  convert,
  normalize,
} from '../utils/rates.js';
import {
  buildInsight,
  currencyNote,
} from '../utils/advice.js';
import { CURRENCIES } from '../utils/constants.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await getRates();
    res.json({
      base: 'USD',
      date: data.date,
      rates: data.rates,
      currencies: CURRENCIES,
    });
  })
);

router.get(
  '/convert',
  asyncHandler(async (req, res) => {
    const amount = parseFloat(req.query.amount);
    const from = normalize(req.query.from || 'USD');
    const to = normalize(req.query.to || 'USD');
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ message: 'amount must be a number' });
    }
    const converted = await convert(amount, from, to);
    res.json({ from, to, amount, converted: Math.round(converted * 100) / 100 });
  })
);

router.get(
  '/insight',
  asyncHandler(async (req, res) => {
    const code = normalize(req.query.to || '');

    if (!code || !CURRENCIES.includes(code)) {
      return res.status(400).json({ message: 'Valid ?to= currency required' });
    }
    if (code === 'USD') {
      return res.json({ code: 'USD', insight: null });
    }

    const { rates } = await getRates();
    const rate = rates[code];
    const history = await getRateHistory(code);

    const insight = buildInsight(rate, history);

    res.json({
      code,
      rate: Math.round(rate * 10000) / 10000,
      historical: history,
      note: currencyNote(code),
      insight,
    });
  })
);

export default router;