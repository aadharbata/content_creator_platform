const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Brand = require('../models/Brand');
require('dotenv').config();

const router = express.Router();

// Creator/Fan Signup
router.post('/creator-fan/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Brand Signup
router.post('/brand/signup', async (req, res) => {
  try {
    const { gstNumber, companyName, brandName, contactPerson, email, password, industry } = req.body;
    if (!brandName || !contactPerson || !email || !password || !industry) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await Brand.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists.' });
    const hashed = await bcrypt.hash(password, 10);
    const brand = new Brand({ gstNumber, companyName, brandName, contactPerson, email, password: hashed, industry });
    await brand.save();
    res.status(201).json({ message: 'Brand registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login (for both User and Brand)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    let type = 'user';
    if (!user) {
      user = await Brand.findOne({ email });
      type = 'brand';
    }
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });
    const payload = { id: user._id, type };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, type });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router; 