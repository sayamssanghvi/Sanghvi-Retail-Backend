const express = require('express');

const { Customer } = require('../models/Customer');
const { Sale } = require('../models/Sale');
const Auth = require('../middleware/Auth');

const router = express.Router();

router.get("/customer/getdetails/:number", Auth, async (req, res) => {
  
    try {
        var cust = await Customer.findOne({ phonenumber: req.params.number });
        if (!cust)
            return res.status(500).send({ status: 2, error: "Custoemr not found" });
        res.send({ status: 1, cust });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99 ,error:e.messgae});
    }

});

router.get('/customer/sale/:number',Auth ,async (req, res) => {
   
    try {
        let customer = await Customer.findOne({ phonenumber: req.params.number });
        if (!customer)
            return res.status(500).send({ status: 2, error: "Customer Not found" });
        match = {};
        sort = {};
        console.log(req.query);
        sort[req.query.sort] = req.query.order == 'desc' ? -1 : 1;
        await customer.populate({
            path: 'sales',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send({ status: 1, sales: customer.sales });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99, error: e.message });
    }

});

router.post('/customer/registration',Auth ,async (req, res) => {

    try {
        var cust = new Customer({
            name: req.body.name,
            phonenumber: req.body.phonenumber,
            email: req.body.email,
        });
        await cust.save();
        res.send({status:1,cust});
    } catch (e) {
        console.log(e);
        res.status(500).send({status:-99,error:e.message});
    }

});

router.post('/customer/new/sale', Auth, async (req, res) => {
    
    try {
        let cust = await Customer.findOne({ phonenumber: req.body.phonenumber });

        if (!cust)
            return res.status(500).send({ status: 2, error: "Phonenumber is not registered" });

        let sale = new Sale({
            amount: req.body.amount,
            user: req.body.phonenumber
        });

        await sale.save();
        res.send({ status: 1 });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99 ,error:e.message});
    }

});

router.put('/customer/update/details/:number',Auth,async (req, res) => {
    
    try {
        let cust = await Customer.updateOne({ phonenumber: req.params.number },
            {
                phonenumber : req.body.phonenumber,
                email: req.body.email,
                name : req.body.name
            });

        if (cust.n != 1 && cust.nModified != 1)
            return res.status(500).send({ status: 2, error: "Phonenumber not found" });

        let result = await Sale.updateMany({ user: req.params.number }, { user: req.body.phonenumber });

        if (result.n != result.nModified)
            return res.status(500).send({ status: 50, eror: "Semi Update Incosistency in database" });
        
        res.send({ status: 1 });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99 ,error:e.message});
    }
});

router.put('/customer/update/sale/:id', Auth, async (req, res) => {
   
    try {
        var sale = await Sale.updateOne({ _id: req.params.id },
            {
                amount :req.body.amount,
                user :req.body.phonenumber
            }
        );
        
        if (sale.n != 1)
            return res.status(500).send({ status: 2, error: "Sale Id not found" });
        if (sale.n != sale.nModified)
            return res.status(500).send({ status: 51, error: "Update Unsuccessfull" });
        
        res.send({ status: 1 });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99,error:e.message});
    }

});

module.exports = router;