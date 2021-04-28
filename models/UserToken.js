const mongoose = require('mongoose');

const UserTokenSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  fcmTokens: [{
    type: String,
  }],
  reviewNotificationsOn: {
    type: Boolean,
  },
  reviewNotificationsTime: {
    type: String,
  },
  timeZone: {
    type: String,
  },
  lastLoginTime: {
    type: Number,
  },
});

module.exports = UserToken = mongoose.model('userToken', UserTokenSchema, 'UserToken');