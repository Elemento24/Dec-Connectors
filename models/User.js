const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A User must have a name!']
  },
  email: {
    type: String,
    required: [true, 'A User must have an Email!'],
    unique: [true, 'Email must be unique!']
  },
  password: {
    type: String,
    required: [true, 'A User must have a Password!']
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now()
  }
});

module.exports = User = mongoose.model('user', UserSchema);