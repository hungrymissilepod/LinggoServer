const express = require('express');
const path = require('path');
const connectDB = require('./db');

// Load .env config
// var env_path = process.env.NODE_ENV == 'production' ? '.env.prod' : '.env.dev';
var env_path = '.env.dev';
require('dotenv').config({ path: env_path });

console.log('got dotenv');
console.log(process.env.NODE_ENV);
console.log(env_path);
console.log(process.env.MONGO_URI);
console.log(process.env.JWT_SECRET);
console.log(process.env.SERVER_VERSION);

const app = express();

// Connect to database
connectDB();

// Init Middleware
app.use(express.json({ extended: false, limit: '50mb' }));

// Define routes
app.use('/api/cheats', require('./routes/api/cheats'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/db/user', require('./routes/api/db/user'));
app.use('/api/db/language', require('./routes/api/db/language'));
app.use('/api/db/module', require('./routes/api/db/module'));

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