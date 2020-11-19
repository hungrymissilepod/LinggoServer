const express = require('express');
const path = require('path');

const app = express();

app.get('/', (req, res) => res.send('API Running'));

// Init Middleware
app.use(express.json({ extended: false }));

// Define routes
app.use('/api/cheats', require('./routes/api/cheats'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));