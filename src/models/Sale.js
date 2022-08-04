const mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    name: {
        type: String,
        required:true
    },
    amount: {
        type: Number,
        required: true,
        trim:true,
    },
    user: {
        type: String,
        ref:'Customer'
    },
    admin: {
        type: String,
        ref:'Admin'
    },
    saleCode: {
        type: String,
        uppercase: true,
        unique:true
    }
}, {
    timestamps:true
});

var Sale = mongoose.model('Sale', Schema);

module.exports = Sale;
