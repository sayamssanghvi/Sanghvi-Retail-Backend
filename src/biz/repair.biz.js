// @ts-check
const RepairSale = require('../models/RepairSale');
const Status = require('../constants/status');
const Messages = require('../constants/messages');
const IsNullOrUndefined = require('../utilities/nullCheck');
const _ = require('lodash');

class RepairBiz {

    constructor() {

    }

    submitEstimate(req) {
        return new Promise(async (resolve, reject) => {
            try {
                if (IsNullOrUndefined(req.body.estimate) || IsNullOrUndefined(req.body.machineRepairCode))
                    return reject({ status: -1, error: Messages.INSUFFICIENT_DATA, data: req.body });

                let repairMachine = await RepairSale.findOne({ machineRepairCode: req.body.machineRepairCode });
                if (repairMachine == undefined || repairMachine == null)
                    return reject({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE, data: req.body });

                if (repairMachine.callBeforeRepair == false || repairMachine.status != Status.RECEIVED)
                    return reject({ status: -1, error: Messages.ESTIMATE_NOT_REQUIRED, data: req.body });

                let updatedRepairMachine = await RepairSale.findOneAndUpdate(
                    { machineRepairCode: req.body.machineRepairCode },
                    {
                        status: Status.ESTIMATE_SUBMITTED,
                        estimate: req.body.estimate,
                        $set: {
                            "date.estimateGivenDate": new Date().getTime()
                        }
                    },
                    { new: true }
                );

                resolve({ status: 1, data: updatedRepairMachine });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = RepairBiz;