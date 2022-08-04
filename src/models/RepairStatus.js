const mongoose = require('mongoose');

let Schema = mongoose.Schema({
    status: {
        type: String,
        uppercase: true,
        trim: true,
        required: true
    }
}, {
    timestamps:true
});

let RepairStatus = mongoose.model('RepairStatus', Schema);

module.exports = RepairStatus;