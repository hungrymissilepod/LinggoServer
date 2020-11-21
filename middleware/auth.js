const jwt = require('jsonwebtoken');
const config = require('config');

function verifyJWTToken (req, res, next) {
  const token = req.header('x-auth-token');
  console.log(token);

  // If request does not have a token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
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
  var devices = config.get('whitelistDevices').split(',');
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

module.exports = { verifyJWTToken, verifyWhiteListDevice }