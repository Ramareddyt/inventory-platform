const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true, trim: true },
    contactPerson:      { type: String, default: '' },
    email:              { type: String, default: '' },
    phone:              { type: String, default: '' },
    address:            { type: String, default: '' },
    categories:         [{ type: String }],
    averageLeadTime:    { type: Number, default: 7 },
    onTimeDeliveryRate: { type: Number, default: 100 },
    totalOrders:        { type: Number, default: 0 },
    status:             { type: String, enum: ['Active','Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
