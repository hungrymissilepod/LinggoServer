const mongoose = require('mongoose');

const DailyEXPSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  list: [{
    type: Object,
  }],
});

module.exports = DailyEXP = mongoose.model('dailyEXP', DailyEXPSchema, 'DailyEXP');