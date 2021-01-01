const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
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
  units: [{
    type: Object,
  }],
  lessons: {
    vocabLessons: [{
      type: Object,
    }],
    grammarLessons: [{
      type: Object,
    }],
    studyLessons: [{
      type: Object,
    }],
  },
  timeStamp: {
    type: Number,
    required: true,
  },
  updated: {
    type: Number,
    required: true,
  },
});

module.exports = ModuleSchema;