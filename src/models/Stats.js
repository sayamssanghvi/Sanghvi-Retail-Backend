const mongoose = require('mongoose');

let Schema = mongoose.Schema({
    statName: {
        type: String,
        uppercase: true,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
}, {
    timestamps:true
});

let Stat = mongoose.model('Stat', Schema);

module.exports = Stat;