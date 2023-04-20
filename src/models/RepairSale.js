const mongoose = require('mongoose');
const RepairParts = require('./RepairParts');

//Dates Schema
let dateSchema = new mongoose.Schema({
    receivedDate: {
        type: Date,
    },
    estimateGivenDate: {
        type: Date,
    },
    inRepairStartDate: {
        type: Date,
    },
    sentToFactoryDate: {
        type: Date,
    },
    repairedDate: {
        type: Date,
    },
    deliveryDate: {
        type: Date,
    },
    canceledDate: {
        type: Date,
    }
});

//Discount Schema
let discountSchema = new mongoose.Schema({
    amount: {
        type: Number
    },
    reason: {
        type: String
    }
});

let Schema = new mongoose.Schema({
    date: {
        type: dateSchema,
        required: true
    },
    status: {
        type: String,
        uppercase: true
    },
    faults: [{
        type: String,
        required: true,
        uppercase: true
    }],
    machineRepairCode: {
        type: String,
        unique: true,
        uppercase: true
    },
    repairs: [{
        part: RepairParts.Schema,
        quantity: {
            type: Number,
        }
    }],
    callBeforeRepair: {
        type: Boolean
    },
    estimate: {
        type: Number
    },
    totalAmount: {
        type: Number
    },
    discount: {
        type: discountSchema
    },
    customer: {
        type: String,
        ref: 'Customer'
    },
    admin: {
        type: String,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

let RepairSale = mongoose.model('RepairSale', Schema);

module.exports = RepairSale;