const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  words: [{
    type: Object,
  }],
  questions: [{
    type: Object,
  }],
});

module.exports = LanguageSchema;