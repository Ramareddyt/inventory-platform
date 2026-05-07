require('dotenv').config();
const mongoose = require('mongoose');

const User              = require('./models/User');
const Supplier          = require('./models/Supplier');
const Product           = require('./models/Product');
const StockLevel        = require('./models/StockLevel');
const InventoryTransaction = require('./models/InventoryTransaction');
const PurchaseOrder     = require('./models/PurchaseOrder');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas');

  // Clear everything
  await Promise.all([
    User.deleteMany(), Supplier.deleteMany(), Product.deleteMany(),
    StockLevel.deleteMany(), InventoryTransaction.deleteMany(), PurchaseOrder.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────
  const [admin, manager, procurement, operator] = await User.insertMany([
    { name: 'Admin User',         email: 'admin@inveniq.com',       password: 'admin123',   role: 'admin' },
    { name: 'Inventory Manager',  email: 'manager@inveniq.com',     password: 'manager123', role: 'inventory_manager' },
    { name: 'Procurement Officer',email: 'procurement@inveniq.com', password:'proc1234',    role: 'procurement_officer' },
    { name: 'Warehouse Operator', email: 'operator@inveniq.com',    password:'op123456',      role: 'warehouse_operator' },
  ]);
  console.log('✅ Users created');

  // ── Suppliers ──────────────────────────────────────────────────────────
  const [s1, s2, s3] = await Supplier.insertMany([
    { name: 'TechParts Pvt Ltd',       contactPerson: 'Ravi Kumar',  email: 'ravi@techparts.com',   phone: '9876543210', categories: ['Spare Parts & MRO'],           averageLeadTime: 5,  onTimeDeliveryRate: 95 },
    { name: 'QuickStock Distributors', contactPerson: 'Priya Sharma',email: 'priya@quickstock.com', phone: '9123456789', categories: ['Retail Products','Finished Goods'], averageLeadTime: 3,  onTimeDeliveryRate: 98 },
    { name: 'BulkBuy Industries',      contactPerson: 'Anand Rao',   email: 'anand@bulkbuy.com',    phone: '9988776655', categories: ['Raw Materials'],               averageLeadTime: 10, onTimeDeliveryRate: 88 },
  ]);
  console.log('✅ Suppliers created');

  // ── Products ───────────────────────────────────────────────────────────
  const products = await Product.insertMany([
    { skuCode:'RM-001', name:'Steel Rods (10mm)',          category:'Raw Materials',     unit:'kg',    reorderPoint:100, safetyStock:50, economicOrderQty:500, costPrice:85,    sellingPrice:110,  supplier:s3._id, leadTimeDays:10 },
    { skuCode:'RM-002', name:'PVC Granules',               category:'Raw Materials',     unit:'kg',    reorderPoint:200, safetyStock:80, economicOrderQty:1000,costPrice:45,    sellingPrice:65,   supplier:s3._id, leadTimeDays:7  },
    { skuCode:'FG-001', name:'Laptop 15" Pro',             category:'Finished Goods',    unit:'pcs',   reorderPoint:20,  safetyStock:10, economicOrderQty:50,  costPrice:45000, sellingPrice:58000,supplier:s2._id, leadTimeDays:3  },
    { skuCode:'FG-002', name:'Wireless Headphones',        category:'Finished Goods',    unit:'pcs',   reorderPoint:30,  safetyStock:15, economicOrderQty:100, costPrice:2500,  sellingPrice:3800, supplier:s2._id, leadTimeDays:2  },
    { skuCode:'SP-001', name:'Industrial Bearings 6205',   category:'Spare Parts & MRO', unit:'pcs',   reorderPoint:50,  safetyStock:20, economicOrderQty:200, costPrice:350,   sellingPrice:500,  supplier:s1._id, leadTimeDays:5  },
    { skuCode:'SP-002', name:'Hydraulic Oil 68',           category:'Spare Parts & MRO', unit:'ltr',   reorderPoint:40,  safetyStock:15, economicOrderQty:150, costPrice:220,   sellingPrice:320,  supplier:s1._id, leadTimeDays:4  },
    { skuCode:'PG-001', name:'Fresh Milk (1L)',             category:'Perishable Goods',  unit:'ltr',   reorderPoint:100, safetyStock:40, economicOrderQty:300, costPrice:48,    sellingPrice:65,   supplier:s2._id, leadTimeDays:1, shelfLifeDays:5 },
    { skuCode:'RT-001', name:'Office Notebooks (Pack of 5)',category:'Retail Products',   unit:'packs', reorderPoint:50,  safetyStock:20, economicOrderQty:200, costPrice:120,   sellingPrice:185,  supplier:s2._id, leadTimeDays:2  },
    { skuCode:'RT-002', name:'Ballpoint Pens (Box of 50)', category:'Retail Products',   unit:'boxes', reorderPoint:30,  safetyStock:10, economicOrderQty:100, costPrice:95,    sellingPrice:150,  supplier:s2._id, leadTimeDays:2  },
    { skuCode:'WS-001', name:'Stretch Wrap Film',          category:'Warehouse Supplies', unit:'rolls', reorderPoint:20,  safetyStock:8,  economicOrderQty:80,  costPrice:280,   sellingPrice:380,  supplier:s3._id, leadTimeDays:5  },
  ]);
  console.log('✅ Products created');

  // ── Stock Levels ───────────────────────────────────────────────────────
  const stockData = [
    { idx:0, onHand:45,  risk:'Medium'   },  // RM-001 below ROP(100)
    { idx:1, onHand:380, risk:'Low'      },
    { idx:2, onHand:8,   risk:'High'     },  // FG-001 below safety(10)
    { idx:3, onHand:72,  risk:'Low'      },
    { idx:4, onHand:0,   risk:'Critical' },  // SP-001 OUT OF STOCK
    { idx:5, onHand:12,  risk:'Medium'   },
    { idx:6, onHand:38,  risk:'Medium'   },
    { idx:7, onHand:90,  risk:'Low'      },
    { idx:8, onHand:5,   risk:'High'     },  // RT-002 below safety(10)
    { idx:9, onHand:30,  risk:'Low'      },
  ];

  for (const { idx, onHand, risk } of stockData) {
    await StockLevel.create({ product: products[idx]._id, onHand, available: onHand, riskScore: risk });
  }
  console.log('✅ Stock levels created');

  // ── Sample Transactions (spread over last 14 days) ─────────────────────
  const txTypes = ['Goods Receipt','Sales Issue','Sales Issue','Goods Receipt','Sales Issue','Adjustment Increase'];
  for (let i = 0; i < 20; i++) {
    const p     = products[i % products.length];
    const type  = txTypes[i % txTypes.length];
    const qty   = Math.floor(Math.random() * 25) + 5;
    const daysAgo = Math.floor(Math.random() * 14);
    await InventoryTransaction.create({
      product: p._id,
      transactionType: type,
      quantity: qty,
      previousStock: 100,
      newStock: type.includes('Receipt') || type.includes('Increase') ? 100 + qty : 100 - qty,
      reason: 'Seed data',
      performedBy: operator._id,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  }
  console.log('✅ Transactions created');

  // ── Sample Purchase Order ──────────────────────────────────────────────
  await PurchaseOrder.create({
    supplier: s1._id,
    items: [
      { product: products[4]._id, orderedQuantity: 200, receivedQuantity: 0, unitPrice: 350 },
      { product: products[5]._id, orderedQuantity: 150, receivedQuantity: 0, unitPrice: 220 },
    ],
    status: 'Sent',
    expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    notes: 'Urgent — SP-001 out of stock',
    createdBy: procurement._id,
  });
  console.log('✅ Sample PO created');

  console.log(`
╔═══════════════════════════════════════════════╗
║        ✅  SEED COMPLETE — InvenIQ             ║
╠═══════════════════════════════════════════════╣
║  Admin:       admin@inveniq.com / admin123    ║
║  Manager:     manager@inveniq.com / manager123║
║  Procurement: procurement@inveniq.com / proc123║
║  Operator:    operator@inveniq.com / op123    ║
╚═══════════════════════════════════════════════╝
  `);

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
