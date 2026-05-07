const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product:          { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderedQuantity:  { type: Number, required: true },
  receivedQuantity: { type: Number, default: 0 },
  unitPrice:        { type: Number, required: true },
});

const poSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items:    [itemSchema],
    status: {
      type: String,
      enum: ['Draft','Sent','Acknowledged','Partially Received','Completed','Cancelled'],
      default: 'Draft',
    },
    expectedDeliveryDate: { type: Date },
    totalAmount:          { type: Number, default: 0 },
    notes:                { type: String, default: '' },
    createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

poSchema.pre('save', function (next) {
  if (!this.poNumber) this.poNumber = 'PO-' + Date.now();
  this.totalAmount = this.items.reduce((sum, i) => sum + i.orderedQuantity * i.unitPrice, 0);
  next();
});

module.exports = mongoose.model('PurchaseOrder', poSchema);
