var { RepairParts } = require('../../models/RepairParts');
var RepairPartsConstants = require('../../constants/dbvalues').RepairParts;
var MachineType = require('../../constants/dbvalues').MachineType;

module.exports = (async function RepairRRPartsWithPrices() {
    try {
        for (var [key, value] of Object.entries(RepairPartsConstants)) {
            let price;
            let quantityRequired = false;
            if (value == RepairPartsConstants.BASE_REPAIR_CHARGE)
                price = 200;
            else if (value == RepairPartsConstants.COATING) {
                price = 120;
                quantityRequired = true;
            }
            else if (value == RepairPartsConstants.ELEMENT) {
                price = 150;
                quantityRequired=true
            }
            else if (value == RepairPartsConstants.F_G_WIRE_SET)
                price = 100;
            else if (value == RepairPartsConstants.HANDLE) {
                price = 100;
                quantityRequired=true
            }
            else if (value == RepairPartsConstants.LAMP_BOX)
                price = 50;
            else if (value == RepairPartsConstants.NEW_PLATE) {
                price = 275;
                quantityRequired=true
            }
            else if (value == RepairPartsConstants.REVIT)
                price = 50;
            else if (value == RepairPartsConstants.R_G_BULB)
                price = 150;
            else if (value == RepairPartsConstants.THERMOSTAT)
                price = 100;
            else if (value == RepairPartsConstants.WIRECORD)
                price = 120;
            else if (value == RepairPartsConstants['3_PIN'])
                price = 50;
            else if (value == RepairPartsConstants.NEW_KHUMSA) {
                price = 150;
                quantityRequired = true;
            }
            let part = new RepairParts({
                name: value,
                price,
                machineName: MachineType.ROTI_ROASTER,
                quantityRequired,
            });
            await part.save();
        }
        return true;
    } catch (error) {
        return false;
    }
})();