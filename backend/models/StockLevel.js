const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    onHand:    { type: Number, default: 0 },
    reserved:  { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    riskScore: { type: String, enum: ['Critical','High','Medium','Low'], default: 'Low' },
    warehouse: { type: String, default: 'Main Warehouse' },
  },
  { timestamps: true }
);

stockSchema.pre('save', function (next) {
  this.available = Math.max(0, this.onHand - this.reserved);
  next();
});

module.exports = mongoose.model('StockLevel', stockSchema);
