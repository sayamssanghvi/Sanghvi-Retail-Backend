const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const validator = require('validator');

const Schema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  phonenumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    validate(value) {
      if (value.toString().length != 10)
        throw new Error("PhoneNumber length should be 10");
      if (value.toString().slice(0, 1) == '0')
        throw new Error("PhoneNumber cannot start with 0");
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value))
        throw new Error("Please enter a valid email Id");
    }
  },
}, {
  timestamps:true
});


Schema.virtual('sales', {
  ref: 'Sale',
  localField: 'phonenumber',
  foreignField: 'user'
});

var Customer = new mongoose.model('Customer', Schema);

module.exports = {
  Customer
}