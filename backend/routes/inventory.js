const express              = require('express');
const InventoryTransaction = require('../models/InventoryTransaction');
const StockLevel           = require('../models/StockLevel');
const Product              = require('../models/Product');
const { protect }          = require('../middleware/auth');

const router = express.Router();

const INBOUND  = ['Goods Receipt', 'Adjustment Increase', 'Return from Customer'];
const OUTBOUND = ['Sales Issue', 'Adjustment Decrease', 'Scrap/Write-Off', 'Stock Transfer'];

// GET transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const { type, productId, limit = 100 } = req.query;
    const q = {};
    if (type)      q.transactionType = type;
    if (productId) q.product = productId;

    const txs = await InventoryTransaction.find(q)
      .populate('product', 'name skuCode')
      .populate('performedBy', 'name')
      .sort('-createdAt')
      .limit(Number(limit));

    res.json({ success: true, data: txs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST record transaction
router.post('/transactions', protect, async (req, res) => {
  try {
    const { productId, transactionType, quantity, reason = '', reference = '' } = req.body;

    let stock = await StockLevel.findOne({ product: productId });
    if (!stock) stock = await StockLevel.create({ product: productId, onHand: 0 });

    const prev = stock.onHand;
    let next   = prev;

    if (INBOUND.includes(transactionType)) {
      next = prev + quantity;
    } else if (OUTBOUND.includes(transactionType)) {
      if (prev < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
      next = prev - quantity;
    }

    stock.onHand = next;

    // Update risk score
    const product = await Product.findById(productId);
    if (product) {
      if (next <= 0)                        stock.riskScore = 'Critical';
      else if (next <= product.safetyStock) stock.riskScore = 'High';
      else if (next <= product.reorderPoint)stock.riskScore = 'Medium';
      else                                  stock.riskScore = 'Low';
    }
    await stock.save();

    const tx = await InventoryTransaction.create({
      product: productId,
      transactionType,
      quantity,
      previousStock: prev,
      newStock: next,
      reason,
      reference,
      performedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET stock levels
router.get('/stock-levels', protect, async (req, res) => {
  try {
    const stocks = await StockLevel.find().populate({ path: 'product', populate: { path: 'supplier', select: 'name' } });
    res.json({ success: true, data: stocks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET alerts (products at or below reorder point)
router.get('/alerts', protect, async (req, res) => {
  try {
    const stocks = await StockLevel.find().populate('product');
    const alerts = [];

    for (const s of stocks) {
      if (!s.product || s.product.status === 'Inactive') continue;
      const { reorderPoint, safetyStock, name } = s.product;
      if (s.onHand <= 0)
        alerts.push({ product: s.product, stock: s, level: 'Critical', message: `${name} is OUT OF STOCK` });
      else if (s.onHand <= safetyStock)
        alerts.push({ product: s.product, stock: s, level: 'High',     message: `${name} is below safety stock` });
      else if (s.onHand <= reorderPoint)
        alerts.push({ product: s.product, stock: s, level: 'Medium',   message: `${name} reached reorder point` });
    }

    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
