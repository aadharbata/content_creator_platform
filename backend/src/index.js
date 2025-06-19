const express = require('express');
const cors = require('cors');
const connectDB = require('./db.js');
require('dotenv').config();
const authRoutes = require('./routes/auth.js');
const gstRoutes = require('./routes/gst.js');
const courseRoutes = require('../api/courses/route.ts')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// connectDB();

// Test route
app.get('/', (req, res) => {
  res.send('API is running');
});

// TODO: Add auth and GST routes here
app.use('/api/auth', authRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/courses', courseRoutes);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; 