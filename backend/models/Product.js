const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    skuCode:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    name:             { type: String, required: true, trim: true },
    description:      { type: String, default: '' },
    category: {
      type: String,
      enum: ['Raw Materials','Finished Goods','Spare Parts & MRO','Perishable Goods','Retail Products','Warehouse Supplies'],
      required: true,
    },
    unit:             { type: String, default: 'pcs' },
    reorderPoint:     { type: Number, required: true, default: 10 },
    safetyStock:      { type: Number, required: true, default: 5 },
    economicOrderQty: { type: Number, default: 50 },
    costPrice:        { type: Number, required: true, default: 0 },
    sellingPrice:     { type: Number, default: 0 },
    leadTimeDays:     { type: Number, default: 7 },
    shelfLifeDays:    { type: Number },
    supplier:         { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    status:           { type: String, enum: ['Active','Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
