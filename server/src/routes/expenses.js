import express from 'express';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { DEFAULT_CATEGORIES } from '../utils/constants.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, startDate, endDate, minAmount, maxAmount, search, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };

    if (category) query.category = category;
    if (search) query.description = { $regex: search, $options: 'i' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);

    const [expenses, total] = await Promise.all([
      Expense.find(query).sort({ date: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Expense.countDocuments(query),
    ]);

    res.json({
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await Expense.distinct('category', { user: req.user._id });
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));
    res.json({ categories: merged });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ expense });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { description, amount, category, date, notes } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({ message: 'Description, amount and category are required' });
    }

    const expense = await Expense.create({
      user: req.user._id,
      description,
      amount: parseFloat(amount),
      category,
      date: date || Date.now(),
      notes,
    });

    res.status(201).json({ expense });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { description, amount, category, date, notes } = req.body;
    expense.description = description ?? expense.description;
    expense.amount = amount !== undefined ? parseFloat(amount) : expense.amount;
    expense.category = category ?? expense.category;
    expense.date = date ?? expense.date;
    expense.notes = notes ?? expense.notes;

    await expense.save();
    res.json({ expense });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  })
);

export default router;