const mongoose = require('mongoose');

let Schema = mongoose.Schema({
    machineName: {
        type: String,
        uppercase: true,
        required:true
    },
    isRepairable: {
        type: Boolean,
        required:true
    },
    baseRepairPrice: {
        type:Number
    },
    machineCode: {
        type: String,
        uppercase: true,
        required:true
    }
}, {
    timestamps:true
});

let MachineType = mongoose.model('MachineType', Schema);

module.exports = MachineType;