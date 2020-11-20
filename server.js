const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

const auth = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');

const app = express();

// Connect to database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Define routes
app.use('/api/cheats', require('./routes/api/cheats'));


// // TODO: move jwt stuff to it's own route
// // @route   GET api/token
// // @desc    Get JWT token
// // @access  Public
// app.get('/api/token', (req, res) => {
//   const uid = req.header('uid');
//   const deviceId = req.header('deviceId');
//   const exp = req.header('exp')
//   // console.log(uid);
//   // console.log(deviceId);
//   // console.log(exp);

//   // If any of these values are null, send failed response
//   if (uid == null || deviceId == null || exp == null) {
//     res.sendStatus(400); // bad request
//   }

//   const payload = {
//     uid: uid,
//     deviceId: deviceId,
//   }

//   jwt.sign(
//     payload,
//     config.get('jwtSecret'),
//     {expiresIn: req.header('exp') },
//   (err, token) => {
//     if (err) throw err;
//     res.json({ token });
//   });
// });

// // ! test protected routes. will respond 'hello' if jwt token is authorised
// app.get('/api/secret', auth, (req, res) => {
//   res.send('hello');
// });

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