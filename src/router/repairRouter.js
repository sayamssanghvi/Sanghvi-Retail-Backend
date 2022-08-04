//@ts-check
const express = require('express');
const Auth = require('../middleware/Auth');

const RepairSale = require('../models/RepairSale');
const Stat = require('../models/Stats');
const Status = require('../constants/status');
const Messages = require('../constants/messages');
const DBValues = require('../constants/dbvalues');
const IsNullOrUndefined = require('../utilities/nullCheck');
const { Customer } = require('../models/Customer');
const { RepairParts } = require('../models/RepairParts');
const { MachineType } = require('../models/MachineType');

const router = express.Router();

//Gets all the repair machines by customer number
router.get("/repair/byPhoneNumber/:number", Auth, async (req, res) => {
  try {
    let customer = await Customer.findOne({ phonenumber: req.params.number }).lean();
    if (!customer)
      return res.status(500).send({ status: 2, error: "Customer Not Found" });
    let match = {};
    let sort = {};
    sort[req.query.sort] = req.query.order == "desc" ? -1 : 1;
    let repairSales=await Customer.findOne({ phonenumber: req.params.number }).lean()
      .populate({
      path: "repairSales",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      }
      });
    res.send({ status: 1, repairSales:repairSales.repairSales });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//Get a single machine by MachineReparCode
router.get("/repair/byMachineRepairCode/:repairCode", Auth, async (req, res) => {
  
  try {
    if (IsNullOrUndefined(req.params.repairCode))
      return res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA ,data:req.body});
    
    let RepairMachine = await RepairSale.findOne({ machineRepairCode: req.params.repairCode });
  
    if (IsNullOrUndefined(RepairMachine))
      return res.status(400).send({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE,data:req.body });
    
    return res.send({ status: 1, data: RepairMachine });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }

});

//Gets all the repair Parts for Machine
router.get("/repair/parts/:machineName", Auth, async (req, res) => {
  try {
    var machineType = await MachineType.find({
      machineName: req.params.machineName,
    });

    if (IsNullOrUndefined(machineType))
      res.status(404).send({ status: -1, error: Messages.MACHINE_DOES_NOT_EXIST });
    else if (machineType.isRepairable == false)
      res.status(404).send({ status: -1, error: Messages.MACHINE_CANNOT_BE_REPAIRED.replace("{machineName}", machineType.machineName) });
    
    let parts = await RepairParts.find({
      machienName: machineType.machineName
    });

    res.send({ status: 1, data: parts });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//register a new repairSale machine
router.post("/repair/generateCode", Auth, async (req, res) => {
  try {
    if (IsNullOrUndefined(req.body) || isNaN(req.body.customer) ||
      req.body.faults.length == 0 || IsNullOrUndefined(req.body.callBeforeRepair) || IsNullOrUndefined(req.body.customer))
      return res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA ,data:req.body});
      
    let customer = await Customer.findOne({ phonenumber: req.body.customer });
    
    if (customer == undefined || customer == null)
    return res.status(400).send({ status: -1, error: Messages.CUSTOMER_DOES_NOT_EXIST +'. '+Messages.REGISTER_THE_CUSTOMER });
    
    let previousCode = await Stat.findOne({statName:DBValues.Stat.REPAIR_SALE_COUNT});
    previousCode.count++;

    let repairSale = new RepairSale({
      date:{ receivedDate:new Date().getTime() },
      status: Status.RECEIVED,
      machineRepairCode: '3R' + previousCode.count,
      faults: req.body.faults,
      customer: req.body.customer,  
      callBeforeRepair: req.body.callBeforeRepair,
      admin:req.admin.phonenumber
    });
      
    await repairSale.save();
    
    let code = await Stat.findOneAndUpdate(
      { statName: DBValues.Stat.REPAIR_SALE_COUNT },
      { count: previousCode.count},
      { new: true }
    );

    res.send({ status: 1, data: repairSale });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//Employee submits the estimate of Repair Cost of Khakra Machine if Call Before
router.post("/repair/submitEstimate", Auth, async (req, res) => {
  try {
    if (IsNullOrUndefined(req.body.estimate) || IsNullOrUndefined(req.body.machineRepairCode))
    return res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA, data: req.body });
  
    let repairMachine = await RepairSale.findOne({ machineRepairCode: req.body.machineRepairCode });
    if (repairMachine == undefined || repairMachine == null)
      return res.status(400).send({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE, data: req.body });
    
    if (repairMachine.callBeforeRepair == false || repairMachine.status != Status.RECEIVED)
      return res.status(400).send({ status: -1, error: Messages.ESTIMATE_NOT_REQUIRED, data: req.body });

    let updatedRepairMachine = await RepairSale.findOneAndUpdate(
      { machineRepairCode: req.body.machineRepairCode },
      {
        status: Status.AWAITING_RESPONSE,
        estimate: req.body.estimate,
        $set: {
          "date.estimateGivenDate": new Date().getTime() 
        }
      },
      { new: true }
    );

    res.send({ status: 1, data: updatedRepairMachine });  
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
  
});

//Change Status from 
//Received -> In_Repair
//Awaiting_response -> In_Repair
//Awaiting_response -> Canceled
//In_Repair -> In_Factory
//Repaired -> Delivered 
router.post('/repair/changeStatus', Auth, async (req, res) => {
  try {
    if (IsNullOrUndefined(req.body.status) || IsNullOrUndefined(req.body.machineRepairCode))
      return res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA, data: req.body });
    
    let repairMachine = await RepairSale.findOne({ machineRepairCode: req.body.machineRepairCode });
    if (IsNullOrUndefined(repairMachine))
      return res.status(400).send({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE, data: req.body });
    
    req.body.status = req.body.status.toUpperCase();

    if (repairMachine.status == Status.RECEIVED && req.body.status == Status.IN_REPAIR)
    {
      if (repairMachine.callBeforeRepair)
        return res.status(400).send({ status: -1, error: Messages.ESTIMATE_NOT_GIVEN, data: req.body });

      let updatedRepairMachine = await RepairSale.findOneAndUpdate(
        { machineRepairCode: req.body.machineRepairCode },
        {
          status: Status.IN_REPAIR,
          $set: {
            "date.inRepairStartDate": new Date().getTime()
          }
        },
        { new: true }
      );

      return res.send({ status: 1, data: updatedRepairMachine });

    }else if (repairMachine.status == Status.AWAITING_RESPONSE && req.body.status == Status.IN_REPAIR)
    {
      let updatedRepairMachine = await RepairSale.findOneAndUpdate(
        { machineRepairCode: req.body.machineRepairCode },
        {
          status: Status.IN_REPAIR,
          $set: {
            "date.inRepairStartDate": new Date().getTime()
          }
        },
        { new: true }
      );

      return res.send({ status: 1, data: updatedRepairMachine });

    } else if(repairMachine.status == Status.AWAITING_RESPONSE && req.body.status == Status.CANCELED)
    {
      let updatedRepairMachine = await RepairSale.findOneAndUpdate(
        { machineRepairCode: req.body.machineRepairCode },
        {
          status: Status.CANCELED,
          $set: {
            "date.canceledDate": new Date().getTime()
          }
        },
        { new: true }
      );

      return res.send({ status: 1, data: updatedRepairMachine });
    } else if (repairMachine.status == Status.IN_REPAIR && req.body.status == Status.IN_FACTORY)
    {
      let updatedRepairMachine = await RepairSale.findOneAndUpdate(
        { machineRepairCode: req.body.machineRepairCode },
        {
          status: Status.IN_FACTORY,
          $set: {
            "date.sentToFactoryDate": new Date().getTime()
          }
        },
        { new: true }
      );

      return res.send({ status: 1, data: updatedRepairMachine });
    }
    else if (repairMachine.status == Status.REPAIRED && req.body.status == Status.DELIVERED)
    {
      let updatedRepairMachine = await RepairSale.findOneAndUpdate(
        { machineRepairCode: req.body.machineRepairCode },
        {
          status: Status.DELIVERED,
          $set: {
            "date.deliveryDate": new Date().getTime()
          }
        },
        { new: true }
      );
        
      return res.send({ status: 1, data: updatedRepairMachine });
    }
    res.status(400).send({ status: -1, error: Messages.INVALID_STATUS_CHANGE, data: req.body });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  } 
});

//Submit Parts ,Calculate Total, Change Status from In_Reapir,In_factory -> Repaired
router.post('/repair/submitParts', Auth, async (req, res) => {
  try {
    if (IsNullOrUndefined(req.body.machineRepairCode) || req.body.repairParts.length == 0)
      return res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA, data: req.body });
    
    let repairMachine = await RepairSale.findOne({ machineRepairCode: req.body.machineRepairCode });
    if (IsNullOrUndefined(repairMachine))
      return res.status(400).send({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE, data: req.body });
    
    if (repairMachine.status == Status.REPAIRED || repairMachine.status == Status.DELIVERED)
      return res.status(400).send({ status: -1, error: Messages.ALREADY_REPAIRED});
    
    if (repairMachine.status != Status.IN_REPAIR && repairMachine.status != Status.IN_FACTORY)
      return res.status(400).send({status:-1,error:Messages.CANNOT_ADD_REPAIR_PARTS})
    
    let partsAndAmount = await addRepairPartsAndCalculateTotal(req.body);

    if (partsAndAmount.repPartsAll.length == 0)
      return res.status(400).send({ status: -1, error: Messages.INVALID_DATA_PASSED, data: req.body });
    
    if (!IsNullOrUndefined(repairMachine.discount) && !IsNullOrUndefined(repairMachine.discount.amount))
      partsAndAmount.totalAmount -= repairMachine.discount.amount;
    
    
    let updatedRepairMachine = await RepairSale.findOneAndUpdate(
      { machineRepairCode: req.body.machineRepairCode },
      {
        $set: {
          "date.repairedDate": new Date().getTime()
        },
        repairs: partsAndAmount.repPartsAll,
        totalAmount: partsAndAmount.totalAmount,
        status: Status.REPAIRED,
      },
      { new: true } 
    );


    res.send({ status: 1, data: updatedRepairMachine });
    
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//Validate and return the machine Name
router.get('/repair/validate/:machineRepairCode',Auth,async (req, res) => {
  try {
    if (IsNullOrUndefined(req.params.machineRepairCode))
      res.status(404).send({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE });
    
    let machineRepairCode = req.params.machineRepairCode;

    let repairSale = await RepairSale.findOne({
      machineRepairCode
    });

    if (IsNullOrUndefined(repairSale))
      res.status(404).send({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE });
    else if (repairSale.status == Status.REPAIRED)
      res.status(200).send({ status: 1, message: Messages.ALREADY_REPAIRED });
    else if (repairSale.status == Status.DELIVERED)    
      res.status(200).send({ status: 1, message: Messages.ALREADY_DELIVERED });
    
    let machineTypeCode = machineRepairCode.substring(0, 1);
    let machine = await MachineType.findOne({
      machineCode: machineTypeCode
    });

    res.send({ status: 1, data: { 'machineName': machine.machineName } });
  } catch (e) {
    console.log(e);
    res.status(500).send({status:-99,error:e.message});
  }
})

//edit a repairSale
router.put('/repair/editSale', Auth, async (req, res) => {
  try {

    if (IsNullOrUndefined(req.body) || IsNullOrUndefined(req.body.machineRepairCode))
      res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA, data: req.body });

    let repairMachine = await RepairSale.findOne({ machineRepairCode: req.body.machineRepairCode });
    if (IsNullOrUndefined(repairMachine))
      return res.status(400).send({ status: -1, error: Messages.ENTER_VALID_REAPIR_CODE, data: req.body });
    
    if (repairMachine.status == Status.CANCELED)
      return res.status(400).send({ status: -1, error: Messages.ONCE_CANCELED_CANNOT_EDIT, data: req.body });
    
    //If discount exist then reason is must else return error message
    if (!IsNullOrUndefined(req.body.discount))
    {
      if (req.body.discount.amount && IsNullOrUndefined(req.body.discount.reason))
        return res.status(400).send({ status: -1, error: Messages.REASON_REQUIRED_FOR_DISCOUNT, data: req.body });
    }
    
    let partsAndAmount = null;
    //If repairParts are added or edited recalculate Total Amount and check if disco
    if (!IsNullOrUndefined(req.body.repairParts) && req.body.repairParts.length) {
      partsAndAmount = await addRepairPartsAndCalculateTotal(req.body);
      
      if (partsAndAmount.repPartsAll.length == 0)
        return res.status(400).send({ status: -1, error: Messages.INVALID_DATA_PASSED, data: req.body });

      //If new discount is passed then calculatte totalAmount using that.
      if (!IsNullOrUndefined(req.body.discount.amount))
        partsAndAmount.totalAmount -= req.body.discount.amount;
      
      //If existing discount is there and new discount is not passed use the existing one to recalculate the totalAmount
      if (!IsNullOrUndefined(repairMachine.discount) && !IsNullOrUndefined(repairMachine.discount.amount) && IsNullOrUndefined(req.body.discount.amount))
        partsAndAmount.totalAmount -= repairMachine.discount.amount;
    } else if (!IsNullOrUndefined(req.body.discount)) {
      if(!IsNullOrUndefined(repairMachine.totalAmount))
        repairMachine.totalAmount -= req.body.discount.amount;
    }

    let inputs = req.body;

    let updatedRepairMachine = await RepairSale.findOneAndUpdate(
      { machineRepairCode: inputs.machineRepairCode },
      {
        date: !IsNullOrUndefined(inputs.date) ? inputs.date : repairMachine.date,
        status: !IsNullOrUndefined(inputs.status) ? inputs.status : repairMachine.status,
        faults: !IsNullOrUndefined(inputs.faults) ? inputs.faults : repairMachine.faults,
        repairs: !IsNullOrUndefined(partsAndAmount) ? partsAndAmount.repPartsAll : repairMachine.repairs,
        callBeforeRepair: !IsNullOrUndefined(inputs.callBeforeRepair) ? inputs.callBeforeRepair : repairMachine.callBeforeRepair,
        estimate: !IsNullOrUndefined(inputs.estimate) ? inputs.estimate : !IsNullOrUndefined(repairMachine.estimate) ? repairMachine.estimate : null,
        totalAmount: !IsNullOrUndefined(partsAndAmount) ? partsAndAmount.totalAmount : !IsNullOrUndefined(repairMachine.totalAmount) ? repairMachine.totalAmount : null,
        discount: !IsNullOrUndefined(inputs.discount) ? inputs.discount :
          !IsNullOrUndefined(repairMachine.discount) ? repairMachine.discount : null,
        customer: !IsNullOrUndefined(inputs.customer) ? inputs.customer : repairMachine.customer,
      },
      { new: true }
    );
    
    res.send({ status: 1, data: updatedRepairMachine });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  } 
});

// Gets all reapired parts and adds base charge if needed and Calculates totalAmount of repair 
async function addRepairPartsAndCalculateTotal(body) {
    let repairParts = body.repairParts;
    let repPartsAll = [];
    let totalAmount = 0;
    let baseChargeCheck = false;

    for (let i = 0; i < repairParts.length; i++)
    {
      if (repairParts[i].name.length > 2 && repairParts[i].quantity>0)
      {
        let part = await RepairPart.findOne({ name: repairParts[i].name.toUpperCase() });
        if (!IsNullOrUndefined(part))
        {
          let repairs = {
            part: part,
            quantity:repairParts[i].quantity  
          }
          repPartsAll.push(repairs);
          totalAmount += (part.price * repairParts[i].quantity);
          
          if (part.name != DBValues.RepairParts.HANDLE && part.name != DBValues.RepairParts.WIRECORD && !baseChargeCheck)
          {
            let baseRepairCharge = await RepairPart.findOne({ name: DBValues.RepairParts.BASE_REPAIR_CHARGE });
            let repair = {
              part: baseRepairCharge,
              quantity:1
            }
            repPartsAll.push(repair);
            totalAmount += baseRepairCharge.price;
            baseChargeCheck = true;
          }
        }
      }
  }
  return { totalAmount, repPartsAll };
}

module.exports = router;