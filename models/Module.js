const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
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
  updated: {
    type: Number,
    required: true,
  },
});

module.exports = ModuleSchema;