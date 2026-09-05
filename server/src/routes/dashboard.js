import express from 'express';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import Recurring from '../models/Recurring.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);

const monthBounds = (offset = 0) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - offset, 1));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() - offset + 1, 1));
  return { start, end };
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { start, end } = monthBounds(0);
    const { start: prevStart, end: prevEnd } = monthBounds(1);

    const [
      totals,
      prevTotals,
      byCategory,
      recentExpenses,
      monthlySpend,
      budgets,
      recurring,
      activeRecurringTotal,
    ] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: prevStart, $lt: prevEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $project: { category: '$_id', total: { $round: ['$total', 2] }, _id: 0 } },
        { $sort: { total: -1 } },
      ]),
      Expense.find({ user: req.user._id, date: { $gte: start, $lt: end } })
        .sort({ date: -1 })
        .limit(8),
      Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth() - 5, 1)) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Budget.find({ user: req.user._id, month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}` }),
      Recurring.find({ user: req.user._id, active: true }),
    ]);

    const currentTotal = totals.length ? totals[0].total : 0;
    const prevTotal = prevTotals.length ? prevTotals[0].total : 0;
    const change = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : null;
    const currentCount = totals.length ? totals[0].count : 0;
    const prevCount = prevTotals.length ? prevTotals[0].count : 0;

    const budgetSpend = {};
    for (const budget of budgets) {
      const spentAgg = await Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            category: budget.category,
            date: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      budgetSpend[budget.category] = spentAgg.length ? spentAgg[0].total : 0;
    }

    const budgetStatus = budgets.map((budget) => {
      const spent = budgetSpend[budget.category] || 0;
      const percent = budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 100) : 0;
      return {
        category: budget.category,
        monthlyLimit: budget.monthlyLimit,
        spent: Math.round(spent * 100) / 100,
        percent,
        status: percent > 100 ? 'exceeded' : percent >= budget.alertThreshold ? 'warning' : 'ok',
        alertThreshold: budget.alertThreshold,
      };
    });

    res.json({
      metrics: {
        currentTotal: Math.round(currentTotal * 100) / 100,
        prevTotal: Math.round(prevTotal * 100) / 100,
        change: change !== null ? Math.round(change * 100) / 100 : null,
        currentCount,
        prevCount,
      },
      byCategory,
      monthlySpend,
      recentExpenses,
      budgetSummary: budgetStatus,
      recurring: {
        items: recurring.length,
        monthlyTotal: Math.round(activeRecurringTotal.reduce((sum, r) => {
          const mult = r.frequency === 'daily' ? 30 : r.frequency === 'weekly' ? 4.33 : r.frequency === 'monthly' ? 1 : 1 / 12;
          return sum + r.amount * mult;
        }, 0) * 100) / 100,
      },
    });
  })
);

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { startDate, endDate, category } = req.query;

    const query = { user: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) query.category = category;

    const expenses = await Expense.find(query).sort({ date: 1 });

    const escape = (value) => {
      const str = String(value ?? '');
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = ['Date', 'Description', 'Category', 'Amount', 'Notes'];
    const rows = expenses.map((e) => [
      e.date.toISOString().slice(0, 10),
      escape(e.description),
      escape(e.category),
      e.amount.toFixed(2),
      escape(e.notes),
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const userCurrency = req.user.defaultCurrency || 'USD';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expenses_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csv);
  })
);

export default router;