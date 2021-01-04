const express = require('express');
const bcrypt = require('bcrypt');
const { Admin } = require('../models/Admin');
const { Sale } = require('../models/Sale');
const Auth = require('../middleware/Auth');
const router = express.Router();

router.post('/admin/registration', async (req, res) => {

    try {
        if (req.body.special != process.env.ADMIN_REG_KEY)
            throw new Error('You are not authenticated to Register a user.Bug Off');
        var admin = new Admin({
            phonenumber: req.body.phonenumber,
            password: req.body.password
        });
        await admin.save();
        res.send({ status: 1});
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99,error:e.message });
    }
});

router.post('/admin/login',async (req, res) => {
   
    try {
        if (req.body.password == null || req.body.phonenumber == null)
            throw new Error("Please enter both password and phonenumber");
        let admin = await Admin.findByCredentials(req.body.phonenumber, req.body.password.toString());
        let token = await admin.generateAuthToken();
        res.send({ status: 1 ,token});
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99, error: e.message });
    }
});

router.get('/admin/sale/count',Auth,async (req, res) => {
    
    try {
        let count = await Sale.find().estimatedDocumentCount();
        res.send({ status: 1, count });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99, error: e.message });
    }
});

router.get('/admin/view/sale',Auth,async (req, res) => {
   
    try {
        let sortby = {};
        sortby[req.query.sort] = req.query.order;
        let sales = await Sale.find({}).sort(sortby).skip(parseInt(req.query.skip)).limit(5).lean();
        if (!sales)
            return res.status(500).send({ status: 2, error: "No Sales Found" });
        res.send({ status: 1, sales });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99, error: e.message });
    }
});


module.exports = router;