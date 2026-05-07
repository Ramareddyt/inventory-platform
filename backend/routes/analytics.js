const express              = require('express');
const Product              = require('../models/Product');
const StockLevel           = require('../models/StockLevel');
const InventoryTransaction = require('../models/InventoryTransaction');
const { protect }          = require('../middleware/auth');

const router = express.Router();

// ─── ABC Analysis (rule-based, no external API) ───────────────────────────
router.get('/abc-analysis', protect, async (req, res) => {
  try {
    const stocks = await StockLevel.find().populate('product');
    const items  = stocks
      .filter(s => s.product && s.product.status === 'Active')
      .map(s => ({
        name:       s.product.name,
        sku:        s.product.skuCode,
        category:   s.product.category,
        stockValue: s.onHand * s.product.costPrice,
        onHand:     s.onHand,
      }))
      .sort((a, b) => b.stockValue - a.stockValue);

    const total = items.reduce((sum, i) => sum + i.stockValue, 0);
    let cumulative = 0;

    const result = items.map(i => {
      cumulative += i.stockValue;
      const pct = total > 0 ? (cumulative / total) * 100 : 0;
      return {
        ...i,
        abcClass:     pct <= 70 ? 'A' : pct <= 90 ? 'B' : 'C',
        valuePercent: total > 0 ? ((i.stockValue / total) * 100).toFixed(1) : '0.0',
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Reorder Suggestions (rule-based EOQ logic) ──────────────────────────
router.get('/reorder-suggestions', protect, async (req, res) => {
  try {
    const stocks = await StockLevel.find({ riskScore: { $in: ['Critical','High','Medium'] } })
      .populate({ path: 'product', populate: { path: 'supplier', select: 'name' } });

    const suggestions = stocks
      .filter(s => s.product && s.product.status === 'Active')
      .map(s => {
        const p         = s.product;
        const shortage  = Math.max(0, p.reorderPoint - s.onHand);
        const orderQty  = Math.max(p.economicOrderQty || 50, shortage + p.safetyStock);
        return {
          sku:           p.skuCode,
          productName:   p.name,
          supplier:      p.supplier?.name || 'Unknown',
          currentStock:  s.onHand,
          reorderPoint:  p.reorderPoint,
          safetyStock:   p.safetyStock,
          suggestedQty:  orderQty,
          urgency:       s.riskScore,
          estimatedCost: orderQty * p.costPrice,
          reason:        s.onHand <= 0
            ? 'Product is completely out of stock'
            : s.onHand <= p.safetyStock
            ? `Stock (${s.onHand}) is below safety stock (${p.safetyStock})`
            : `Stock (${s.onHand}) reached reorder point (${p.reorderPoint})`,
        };
      })
      .sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2 };
        return order[a.urgency] - order[b.urgency];
      });

    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Demand Forecast (moving-average, no external API) ───────────────────
router.post('/forecast/:productId', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate('supplier', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const stock = await StockLevel.findOne({ product: product._id });

    // Pull last 30 days of outbound transactions
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const txs     = await InventoryTransaction.find({
      product:         product._id,
      transactionType: { $in: ['Sales Issue','Scrap/Write-Off'] },
      createdAt:       { $gte: since30 },
    });

    const totalDemand30 = txs.reduce((sum, t) => sum + t.quantity, 0);
    const avgDailyDemand = totalDemand30 / 30 || (product.economicOrderQty / 30);

    // Build weekly & monthly forecast using simple moving average + 10 % growth
    const weeklyForecast = Array.from({ length: 4 }, (_, w) => ({
      week:   `Week ${w + 1}`,
      demand: Math.round(avgDailyDemand * 7 * (1 + w * 0.05)),
    }));

    const monthlyForecast = Array.from({ length: 3 }, (_, m) => ({
      month:  `Month ${m + 1}`,
      demand: Math.round(avgDailyDemand * 30 * (1 + m * 0.07)),
    }));

    const onHand         = stock?.onHand || 0;
    const daysUntilOut   = avgDailyDemand > 0 ? Math.round(onHand / avgDailyDemand) : 999;
    const stockoutRisk   = daysUntilOut <= 3 ? 'Critical' : daysUntilOut <= 7 ? 'High' : daysUntilOut <= 14 ? 'Medium' : 'Low';
    const recommendedQty = Math.max(product.economicOrderQty, Math.round(avgDailyDemand * (product.leadTimeDays + 14) + product.safetyStock - onHand));

    const insights = [
      `Average daily demand over last 30 days: ${avgDailyDemand.toFixed(1)} ${product.unit}`,
      `Current stock covers approximately ${daysUntilOut} days of demand`,
      `Recommended order quantity based on EOQ: ${recommendedQty} ${product.unit}`,
      daysUntilOut < product.leadTimeDays ? '⚠️ Stock may run out before supplier lead time — order immediately!' : `Safe to order within ${daysUntilOut - product.leadTimeDays} days`,
      `Supplier lead time: ${product.leadTimeDays} days`,
    ];

    const suggestedActions = [];
    if (stockoutRisk === 'Critical' || stockoutRisk === 'High')
      suggestedActions.push(`Create a Purchase Order for ${recommendedQty} ${product.unit} immediately`);
    if (stock?.riskScore === 'Medium')
      suggestedActions.push('Schedule replenishment within the next week');
    suggestedActions.push(`Review safety stock level — currently set at ${product.safetyStock} ${product.unit}`);

    res.json({
      success: true,
      data: {
        product:          product.name,
        sku:              product.skuCode,
        weeklyForecast,
        monthlyForecast,
        recommendedOrderQty: recommendedQty,
        stockoutRisk,
        daysUntilStockout:   daysUntilOut,
        insights,
        suggestedActions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Inventory Health Score (rule-based) ─────────────────────────────────
router.get('/health-score', protect, async (req, res) => {
  try {
    const stocks = await StockLevel.find().populate('product');
    let total = 0, score = 0;
    const breakdown = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    for (const s of stocks) {
      if (!s.product || s.product.status === 'Inactive') continue;
      total++;
      breakdown[s.riskScore]++;
      if      (s.riskScore === 'Low')      score += 100;
      else if (s.riskScore === 'Medium')   score += 60;
      else if (s.riskScore === 'High')     score += 25;
      // Critical = 0
    }

    const healthPct = total > 0 ? Math.round(score / total) : 100;
    const grade     = healthPct >= 80 ? 'A' : healthPct >= 60 ? 'B' : healthPct >= 40 ? 'C' : 'D';

    res.json({
      success: true,
      data: {
        healthScore: healthPct,
        grade,
        breakdown,
        totalProducts: total,
        message: healthPct >= 80
          ? 'Inventory is in great shape!'
          : healthPct >= 60
          ? 'A few items need attention'
          : 'Multiple critical stock issues — take action now',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
