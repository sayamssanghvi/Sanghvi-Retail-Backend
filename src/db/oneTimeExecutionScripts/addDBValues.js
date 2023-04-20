const { Stat } = require("../../constants/dbvalues");
const Stats = require('../../models/Stats');

module.exports = (async function addDBValues() {
    try {
        for (var [key, value] of Object.entries(Stat)) {
            let machineData = {
                statName: value,
                count: 0
            };
            console.log(machineData);
            await Stats.create(machineData);
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
})();