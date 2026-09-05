import express from 'express';
import Recurring from '../models/Recurring.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);

export const generateDueRecurring = async (userId) => {
  const now = new Date();
  const due = await Recurring.find({ user: userId, active: true, nextDueDate: { $lte: now } });

  let generated = 0;
  for (const item of due) {
    const expense = await Expense.create({
      user: userId,
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: item.nextDueDate <= now ? now : item.nextDueDate,
      notes: `Recurring (${item.frequency})`,
    });

    const next = new Date(item.nextDueDate);
    switch (item.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    item.lastGenerated = new Date();
    item.nextDueDate = next;
    await item.save();
    generated++;
  }

  return { generated, expense: generated > 0 };
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await Recurring.find({ user: req.user._id }).sort({ nextDueDate: 1 });
    res.json({ recurring: items });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { description, amount, category, frequency, nextDueDate } = req.body;

    if (!description || !amount || !category || !frequency || !nextDueDate) {
      return res.status(400).json({
        message: 'Description, amount, category, frequency and next due date are required',
      });
    }

    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ message: 'Invalid frequency' });
    }

    const item = await Recurring.create({
      user: req.user._id,
      description,
      amount: parseFloat(amount),
      category,
      frequency,
      nextDueDate,
    });

    res.status(201).json({ recurring: item });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Recurring.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }

    const { description, amount, category, frequency, nextDueDate, active } = req.body;
    if (description !== undefined) item.description = description;
    if (amount !== undefined) item.amount = parseFloat(amount);
    if (category !== undefined) item.category = category;
    if (frequency !== undefined) item.frequency = frequency;
    if (nextDueDate !== undefined) item.nextDueDate = nextDueDate;
    if (active !== undefined) item.active = active;

    await item.save();
    res.json({ recurring: item });
  })
);

router.post(
  '/process',
  asyncHandler(async (req, res) => {
    const result = await generateDueRecurring(req.user._id);
    res.json(result);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }
    res.json({ message: 'Recurring expense deleted' });
  })
);

export default router;