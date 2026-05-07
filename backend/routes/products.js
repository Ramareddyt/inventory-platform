const express     = require('express');
const Product     = require('../models/Product');
const StockLevel  = require('../models/StockLevel');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET all
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const q = {};
    if (status)   q.status   = status;
    if (category) q.category = category;
    if (search)   q.$or = [
      { name:    { $regex: search, $options: 'i' } },
      { skuCode: { $regex: search, $options: 'i' } },
    ];

    const products = await Product.find(q).populate('supplier', 'name email');

    const result = await Promise.all(products.map(async (p) => {
      const stock = await StockLevel.findOne({ product: p._id });
      return { ...p.toObject(), stock: stock || { onHand: 0, reserved: 0, available: 0, riskScore: 'Low' } };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET one
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name email phone');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const stock = await StockLevel.findOne({ product: product._id });
    res.json({ success: true, data: { ...product.toObject(), stock } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create
router.post('/', protect, async (req, res) => {
  try {
    const { initialStock = 0, ...rest } = req.body;
    const product = await Product.create(rest);
    await StockLevel.create({ product: product._id, onHand: initialStock, available: initialStock });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE (soft)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { status: 'Inactive' });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
