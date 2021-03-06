const express = require('express');
var cors = require('cors')
const path = require('path');
const connectDB = require('./db');

// Load .env config
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// Connect to database
connectDB();

// Init Middleware
app.use(cors())
app.use(express.json({ extended: false, limit: '50mb' }));

// Define routes
app.use('/api/cheats', require('./routes/api/cheats'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/db/user', require('./routes/api/db/user'));
app.use('/api/db/language', require('./routes/api/db/language'));
app.use('/api/db/module', require('./routes/api/db/module'));
app.use('/api/aws/polly', require('./routes/api/aws/polly'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));