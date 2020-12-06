const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  version: {
    type: String,
  },
  build: {
    type: Number,
  },
  id: {
    type: String,
  },
  words: [{
    type: Object,
  }],
  questions: [{
    type: Object,
  }],
  updated: {
    type: Number,
    required: true,
  },
});

module.exports = LanguageSchema;