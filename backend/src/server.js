require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 4000;
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaam-hisab';

mongoose.connect(URI).then(() => {
  console.log('MongoDB connected');
  // 0.0.0.0 so a phone on the same Wi-Fi can reach the API
  app.listen(PORT, '0.0.0.0', () => console.log(`Kaamtally API on http://localhost:${PORT}`));
}).catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
