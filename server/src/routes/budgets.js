import express from 'express';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);

const getSpentForBudget = (req, budget) => {
  const [year, month] = budget.month.split('-');
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        category: budget.category,
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]).then((r) => (r.length ? r[0].total : 0));
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let { month } = req.query;
    const now = new Date();
    month = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const budgets = await Budget.find({ user: req.user._id, month });

    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await getSpentForBudget(req, budget);
        const percent = budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 100) : 0;
        return {
          id: budget._id,
          category: budget.category,
          monthlyLimit: budget.monthlyLimit,
          month: budget.month,
          alertThreshold: budget.alertThreshold,
          spent: Math.round(spent * 100) / 100,
          percent,
          status: percent > 100 ? 'exceeded' : percent >= budget.alertThreshold ? 'warning' : 'ok',
        };
      })
    );

    res.json({ budgets: enriched });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { category, monthlyLimit, month, alertThreshold } = req.body;

    if (!category || !monthlyLimit || !month) {
      return res.status(400).json({ message: 'Category, monthly limit and month are required' });
    }

    const existing = await Budget.findOne({ user: req.user._id, category, month });
    if (existing) {
      return res.status(400).json({ message: 'Budget already exists for this category and month' });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category,
      monthlyLimit,
      month,
      alertThreshold: alertThreshold || 80,
    });

    res.status(201).json({ budget });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const { monthlyLimit, alertThreshold } = req.body;
    if (monthlyLimit !== undefined) budget.monthlyLimit = monthlyLimit;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;

    await budget.save();
    res.json({ budget });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted' });
  })
);

export default router;