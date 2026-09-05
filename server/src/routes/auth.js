import express from 'express';
import User from '../models/User.js';
import { protect, generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      defaultCurrency: user.defaultCurrency,
    },
  });
};

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, defaultCurrency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, defaultCurrency });
    sendTokenResponse(user, 201, res);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    sendTokenResponse(user, 200, res);
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        defaultCurrency: req.user.defaultCurrency,
      },
    });
  })
);

router.put(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const { name, defaultCurrency } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (defaultCurrency) user.defaultCurrency = defaultCurrency;

    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        defaultCurrency: user.defaultCurrency,
      },
    });
  })
);

export default router;