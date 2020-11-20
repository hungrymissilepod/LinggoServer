const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  const token = req.header('x-auth-token');
  console.log(token);

  // If request does not have a token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    console.log(decoded);
    // req.user = decoded.user; // get user from token
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}