var MachineType = require('../../models/MachineType');
var MachineTypeConstants = require('../../constants/dbvalues').MachineType;

module.exports = (async function addMachineType() {
    try {
        for (var [key, value] of Object.entries(MachineTypeConstants)) {
            let machineData = {
                machineName: null,
                isRepairable: false,
                baseRepairPrice: 0,
                machineCode: null,
            }
            if (value == MachineTypeConstants.ROTI_ROASTER) {
                machineData.machineCode = '3R';
                machineData.baseRepairPrice = 200;
                machineData.isRepairable = true;
                machineData.machineName = value;
            } else if (value == MachineTypeConstants.BLENDER) {
                machineData.machineCode = 'BL';
                machineData.baseRepairPrice = 100;
                machineData.machineName = value;
            }
        
            await MachineType.create(machineData);
        }
        console.log("true");
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
})();
