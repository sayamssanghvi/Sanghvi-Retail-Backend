const mongoose = require('mongoose');

var Schema = mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        trim:true,
    },
    user: {
        type: String,
        ref:'Customer'
    }
}, {
    timestamps:true
});

var Sale = new mongoose.model('Sale', Schema);

module.exports = {
    Sale
}