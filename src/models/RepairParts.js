const mongoose = require('mongoose');

let Schema = mongoose.Schema({
    name: {
        type: String,
        uppercase: true
    },
    price: {
        type: Number,
    },
    machineName: {
        type: String,
        uppercase:true
    },
    quantityRequired: {
        type: Boolean,
        default:false
    },
    maxQuantity: {
        type: Number,
        default:2
    }
}, {
    timestamps:true
});

let RepairParts = mongoose.model('RepairParts', Schema);

module.exports = { RepairParts,Schema };

