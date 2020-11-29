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
});

module.exports = UserDataLang = mongoose.model('userDataLang', UserDataLangSchema, 'UserDataLang');