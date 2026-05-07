const express     = require('express');
const Supplier    = require('../models/Supplier');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const suppliers = await Supplier.find({ status: 'Active' }).sort('name');
  res.json({ success: true, data: suppliers });
});

router.get('/:id', protect, async (req, res) => {
  const s = await Supplier.findById(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: s });
});

router.post('/', protect, async (req, res) => {
  try {
    const s = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: s });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  const s = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: s });
});

router.delete('/:id', protect, async (req, res) => {
  await Supplier.findByIdAndUpdate(req.params.id, { status: 'Inactive' });
  res.json({ success: true, message: 'Supplier deactivated' });
});

module.exports = router;
