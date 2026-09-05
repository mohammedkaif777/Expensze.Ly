import express from 'express';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from '../utils/constants.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await Expense.distinct('category', { user: req.user._id });
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));
    res.json({
      categories: merged.map((name) => ({
        name,
        color: CATEGORY_COLORS[name] || '#64748b',
      })),
    });
  })
);

router.get(
  '/spending',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const match = { user: req.user._id };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const result = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $project: { category: '$_id', total: { $round: ['$total', 2] }, count: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]);

    res.json({ categories: result });
  })
);

export default router;