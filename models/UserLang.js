const mongoose = require('mongoose');

const UserDataLangSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  language: {
    type: String,
    required: true,
  },
  exp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  wordsUnlocked: {
    type: Number,
    default: 0
  },
  questionsUnlocked: {
    type: Number,
    default: 0
  },
  playtime: {
    type: Number,
    default: 0
  },
  levels: [{
    type: Object,
  }]
});

module.exports = UserDataLang = mongoose.model('userDataLang', UserDataLangSchema, 'UserDataLang');