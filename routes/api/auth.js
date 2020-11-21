const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');

// @route   GET api/auth/token
// @desc    Get JWT token
// @access  Public
router.get('/token', (req, res) => {
  const uid = req.header('uid');
  const deviceId = req.header('deviceId');
  const exp = req.header('exp')

  // If any of these values are null, send failed response
  if (uid == null || deviceId == null || exp == null) {
    res.sendStatus(400); // bad request
  }

  const payload = {
    uid: uid,
    deviceId: deviceId,
  }

  jwt.sign(
    payload,
    config.get('jwtSecret'),
    {expiresIn: req.header('exp') },
  (err, token) => {
    if (err) throw err;
    res.json({ token });
  });
});

// @route   GET api/auth/secretRoute
// @desc    A protected route using auth middleware to ensure user has JWTToken. Used for testing.
// @access  Private
router.get('/secretRoute', auth.verifyJWTToken, (req, res) => {
  res.send('hello this is secret route');
});

module.exports = router;