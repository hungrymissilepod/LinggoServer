const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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
    process.env.JWT_SECRET,
    {expiresIn: req.header('exp') },
  (err, token) => {
    if (err) throw err;
    res.json({ token });
  });
});

// @route   POST api/auth/verify
// @desc    A protected route using auth middleware to ensure user has JWTToken. Used for testing.
// @access  Private
router.post('/verify', auth.verifyJWTToken, (req, res) => {
  res.status(200).send(req.uid);
});

// @route   GET api/auth/ping
// @desc    A simple route used to ping the server to see if it is down or asleep
// @access  Public
router.get('/ping', (req, res) => {
  res.sendStatus(200);
});

module.exports = router;