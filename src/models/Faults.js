const mongoose = require('mongoose');

let Schema = mongoose.Schema({
    faultName: {
        type: String,
        required: true,
        uppercase: true
    }
}, {
    timestamps:true
});


let Faults = mongoose.model('Faults', Schema);

module.exports = Faults;