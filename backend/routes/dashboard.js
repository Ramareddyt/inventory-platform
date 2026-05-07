const express              = require('express');
const Product              = require('../models/Product');
const StockLevel           = require('../models/StockLevel');
const InventoryTransaction = require('../models/InventoryTransaction');
const PurchaseOrder        = require('../models/PurchaseOrder');
const Supplier             = require('../models/Supplier');
const { protect }          = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/kpis
router.get('/kpis', protect, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ status: 'Active' });
    const stocks        = await StockLevel.find().populate('product');

    let totalStockValue = 0, lowStockCount = 0, outOfStockCount = 0;
    for (const s of stocks) {
      if (!s.product || s.product.status === 'Inactive') continue;
      totalStockValue += s.onHand * (s.product.costPrice || 0);
      if (s.onHand <= 0)                         outOfStockCount++;
      else if (s.onHand <= s.product.reorderPoint) lowStockCount++;
    }

    const pendingOrders  = await PurchaseOrder.countDocuments({ status: { $in: ['Draft','Sent','Acknowledged'] } });
    const totalSuppliers = await Supplier.countDocuments({ status: 'Active' });
    const recentTx       = await InventoryTransaction.find()
      .populate('product', 'name skuCode')
      .sort('-createdAt').limit(10);

    res.json({
      success: true,
      data: { totalProducts, totalStockValue: Math.round(totalStockValue), lowStockCount, outOfStockCount, pendingOrders, totalSuppliers, recentTx },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/category-stats
router.get('/category-stats', protect, async (req, res) => {
  const stats = await Product.aggregate([
    { $match: { status: 'Active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  res.json({ success: true, data: stats });
});

// GET /api/dashboard/transaction-trend (last 7 days)
router.get('/transaction-trend', protect, async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const trend = await InventoryTransaction.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        receipts: { $sum: { $cond: [{ $eq: ['$transactionType','Goods Receipt'] },       '$quantity', 0] } },
        issues:   { $sum: { $cond: [{ $eq: ['$transactionType','Sales Issue'] },          '$quantity', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: trend });
});

module.exports = router;
