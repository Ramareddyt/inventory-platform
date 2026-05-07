process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
   const db = mongoose.connection.collection('users');
   const hash = await bcrypt.hash('admin123',12);
   await db.updateOne({ email: 'admin@inveniq.com' },{$set: { password: hash } });
   console.log(' password fixed! login with admin@inveniq.com/admin123');
   process.exit();
});
