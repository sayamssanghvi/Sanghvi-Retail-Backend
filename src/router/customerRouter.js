const express = require("express");

const IsNullOrUndefined = require('../utilities/nullCheck');

const Auth = require("../middleware/Auth");

const DBValues = require('../constants/dbvalues');
const Messages = require('../constants/messages');
const { Customer } = require("../models/Customer");
const Sale = require('../models/Sale');
const Stat = require('../models/Stats');

const router = express.Router();

//get customer details
router.get("/customer/getdetails/:number", Auth, async (req, res) => {
  try {
    var cust = await Customer.findOne({ phonenumber: req.params.number });
    if (!cust)
      return res.status(500).send({ status: 2, error: "Customer not found" });
    res.send({ status: 1, cust });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.messgae });
  }
});

// Sales purchases made by a individual customer
router.get("/customer/sale/:number", Auth, async (req, res) => {
  try {
    let customer = await Customer.findOne({ phonenumber: req.params.number }).lean();
    if (!customer)
      return res.status(400).send({ status: 2, error: Messages.CUSTOMER_DOES_NOT_EXIST });
    let match = {};
    let sort = {};
    console.log(req.query);
    sort[req.query.sort] = req.query.order == "desc" ? -1 : 1;
    console.log(sort); 
    let custSales=await Customer.findOne({ phonenumber: req.params.number }).lean()
      .populate({
        path: "sales",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      });
    res.send({ status: 1, sales: custSales.sales });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//Registering a customer with SanghviSales
router.post("/customer/registration", Auth, async (req, res) => {
  try {
    if (IsNullOrUndefined(req.body) || IsNullOrUndefined(req.body.name) || IsNullOrUndefined(req.body.phonenumber) || isNaN(req.body.phonenumber))
      return res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA ,data:req.body});

    let existingCustomer = await Customer.findOne({ phonenumber: req.body.phonenumber });
    
    if (!IsNullOrUndefined(existingCustomer))
      return res
        .status(400)
        .send({ status: 2, error: Messages.CUSTOMER_ALREADY_EXISTS + ' with   :' + req.body.phonenumber });
    
    var cust;
    if (!IsNullOrUndefined(req.body.email))
    {
      cust = new Customer({
        name: req.body.name,
        phonenumber: req.body.phonenumber,
        email: req.body.email,
        admin:req.admin.phonenumber
      });
    } else {
      cust = new Customer({
        name: req.body.name,
        phonenumber: req.body.phonenumber,
        admin: req.admin.phonenumber,
        email:req.body.name+'@noemail.com'
      });
    }
    await cust.save();
    res.send({ status: 1, cust });

  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//Register a new sale
router.post("/customer/new/sale", Auth, async (req, res) => {
  try {
    if (IsNullOrUndefined(req.body) || IsNullOrUndefined(req.body.phonenumber))
      res.status(400).send({ status: -1, error: Messages.INSUFFICIENT_DATA, data: req.body });
    
    let cust = await Customer.findOne({ phonenumber: req.body.phonenumber });

    if (IsNullOrUndefined(cust))
      return res
        .status(400)
        .send({ status: 2, error: "Phonenumber is not registered." });

    let previousCode = await Stat.findOne({statName:DBValues.Stat.SALE_COUNT});
    previousCode.count++;

    let sale = new Sale({
      name: req.body.name,
      amount: req.body.amount,
      user: req.body.phonenumber,
      admin: req.admin.phonenumber,
      saleCode: 'S' + previousCode.count
    });

    await sale.save();
    
    let code = await Stat.findOneAndUpdate(
      { statName: DBValues.Stat.SALE_COUNT },
      { count: previousCode.count},
      { new: true }
    );

    res.send({ status: 1 });

  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//update customer details
router.put("/customer/update/details/:number", Auth, async (req, res) => {
  try {
    let cust = await Customer.updateOne(
      { phonenumber: req.params.number },
      {
        phonenumber: req.body.phonenumber,
        email: req.body.email,
        name: req.body.name,
        admin:req.admin.phonenumber
      }
    );

    if (cust.n != 1 && cust.nModified != 1)
      return res
        .status(500)
        .send({ status: 2, error: "Phonenumber not found" });

    let result = await Sale.updateMany(
      { user: req.params.number },
      { user: req.body.phonenumber }
    );

    if (result.n != result.nModified)
      return res
        .status(500)
        .send({ status: 50, error: "Semi Update Incosistency in database" });

    res.send({ status: 1 });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

//update Sale details
router.put("/customer/update/sale/:id", Auth, async (req, res) => {
  try {
    var sale = await Sale.updateOne(
      { _id: req.params.id },
      {
        name: req.body.name,
        amount: req.body.amount,
        user: req.body.phonenumber,
        admin: req.admin.phonenumber,
      }
    );

    if (sale.n != 1)
      return res.status(500).send({ status: 2, error: "Sale Id not found" });
    if (sale.n != sale.nModified)
      return res
        .status(500)
        .send({ status: 51, error: "Update Unsuccessfull" });

    res.send({ status: 1 });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: -99, error: e.message });
  }
});

module.exports = router;
