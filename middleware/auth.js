const jwt = require('jsonwebtoken');

function verifyJWTToken (req, res, next) {
  const token = req.header('x-auth-token');

  // If request does not have a token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.deviceId = decoded.deviceId; // get deviceId from token
    req.uid = decoded.uid; // get uid from token
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

// Checks that this device is whitelisted
function verifyWhiteListDevice (req, res, next) {
  const deviceId = req.header('deviceId');
  console.log('user deviceId' + deviceId);
  var devices = process.env.WHITELIST_DEVICES.split(',');
  var foundDeviceIdMatch = false;
  
  for (i = 0; i < devices.length; i++) {
    console.log(devices[i]);
    if (deviceId == devices[i]) {
      foundDeviceIdMatch = true;
    }
  }

  if (foundDeviceIdMatch) {
    next();
  } else {
    res.status(400).json({ msg: 'Device is forbidden' });
  }
}

function verifyFirebaseCloudFunction (req, res, next) {
  const secret = req.header('secret');

  // If request doest not have the Firebase secret
  if (!secret) {
    return res.status(401).json({ msg: 'No Firebase secret, authorization denied' });
  }

  // Verify secret
  if (secret == process.env.FIREBASE_CLOUD_FUNCTIONS_SECRET) {
    next();
  } else {
    res.status(401).json({ msg: 'Secret is not valid' });
  }
}

module.exports = { verifyJWTToken, verifyWhiteListDevice, verifyFirebaseCloudFunction }