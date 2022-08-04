const mongoose = require('mongoose');

let Schema = mongoose.Schema({
    scriptName: {
        type: String,
        lowercase: true
    }
}, {
    timestamps:true
});

let OneTimeExecutionScriptsForDB = mongoose.model('OneTimeExecutionScriptsForDB', Schema);

module.exports = { OneTimeExecutionScriptsForDB };

