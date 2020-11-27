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
    type: Object,
  },
});

module.exports = ModuleSchema;