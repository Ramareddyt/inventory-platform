const mongoose = require('mongoose');

const txSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    transactionType: {
      type: String,
      enum: ['Goods Receipt','Sales Issue','Adjustment Increase','Adjustment Decrease','Scrap/Write-Off','Return from Customer','Stock Transfer'],
      required: true,
    },
    quantity:      { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock:      { type: Number, required: true },
    reason:        { type: String, default: '' },
    reference:     { type: String, default: '' },
    warehouse:     { type: String, default: 'Main Warehouse' },
    performedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryTransaction', txSchema);
