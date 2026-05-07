const express              = require('express');
const PurchaseOrder        = require('../models/PurchaseOrder');
const StockLevel           = require('../models/StockLevel');
const InventoryTransaction = require('../models/InventoryTransaction');
const Supplier             = require('../models/Supplier');
const { protect }          = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const orders = await PurchaseOrder.find()
    .populate('supplier', 'name email')
    .populate('items.product', 'name skuCode')
    .populate('createdBy', 'name')
    .sort('-createdAt');
  res.json({ success: true, data: orders });
});

router.post('/', protect, async (req, res) => {
  try {
    const po = await PurchaseOrder.create({ ...req.body, createdBy: req.user._id });
    // increment supplier order count
    await Supplier.findByIdAndUpdate(req.body.supplier, { $inc: { totalOrders: 1 } });
    res.status(201).json({ success: true, data: po });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, data: po });
});

// Receive goods — updates stock
router.post('/:id/receive', protect, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    for (const { itemId, qty } of req.body.items) {
      const item = po.items.id(itemId);
      if (!item) continue;
      item.receivedQuantity += qty;

      let stock = await StockLevel.findOne({ product: item.product });
      if (!stock) stock = await StockLevel.create({ product: item.product, onHand: 0 });
      const prev = stock.onHand;
      stock.onHand += qty;
      await stock.save();

      await InventoryTransaction.create({
        product: item.product,
        transactionType: 'Goods Receipt',
        quantity: qty,
        previousStock: prev,
        newStock: stock.onHand,
        reference: po.poNumber,
        performedBy: req.user._id,
      });
    }

    po.status = po.items.every(i => i.receivedQuantity >= i.orderedQuantity) ? 'Completed' : 'Partially Received';
    await po.save();
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
