const mongoose = require('mongoose');

const UserDataLangSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  languages: [{
    type: Object,
  }],
  timeStamp: {
    type: Number,
    required: true,
  },
  updated: {
    type: Number,
    required: true,
  },
});

module.exports = UserDataLang = mongoose.model('userDataLang', UserDataLangSchema, 'UserDataLang');