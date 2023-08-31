const express = require('express');
const { Admin } = require('../models/Admin');
const Sale = require('../models/Sale');
const Messages = require('../constants/messages');
const Auth = require('../middleware/Auth');
const router = express.Router();
const _ = require('lodash');

//admin registeration
router.post('/admin/registration', async (req, res) => {

    try {
        if (req.body.special != process.env.ADMIN_REG_KEY)
            throw new Error('You are not authenticated to Register a user.Bug Off');

        let existAdmin = await Admin.findOne({ phonenumber: req.body.phonenumber }).lean();

        if (!_.isEmpty(existAdmin)) {
            throw new Error('Admin already Exists');
        }

        var admin = new Admin({
            phonenumber: req.body.phonenumber,
            password: req.body.password,
            role: req.body.role
        });
        await admin.save();
        res.send({ status: 1 });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99, error: e.message });
    }
});

//Admin Login
router.post('/admin/login', async (req, res) => {

    try {
        if (req.body.password == null || req.body.phonenumber == null)
            return res.status(404).send({ status: -1, error: Messages.ENTER_PASSWORD_AND_PHNO });
        let admin = await Admin.findByCredentials(req.body.phonenumber, req.body.password.toString());
        let { token, role, language } = await admin.generateAuthToken();
        res.send({ status: 1, token, role, language });
    } catch (e) {
        console.log(e);
        if (e.message == "This phonenumber does not exists")
            res.status(401).send({ status: 401, error: e.message });
        else if (e.message == "Invalid password")
            res.status(403).send({ status: 403, error: e.message });
        else
            res.status(500).send({ status: -99, error: e.message });
    }
});

//Update Admin Details
router.put("/admin/update/details/:number", Auth, async (req, res) => {
    try {
        let cust = await Admin.findOne({ phonenumber: req.params.number });
        cust.password = req.body.password;
        await cust.save();

        res.send({ status: 1 });

    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99, error: e.message });
    }
});

//Get total Sale count
router.get('/admin/sale/count', Auth, async (req, res) => {

    try {
        let count = await Sale.find().estimatedDocumentCount();
        res.send({ status: 1, count });
    } catch (e) {
        console.log(e);
        res.status(500).send({ status: -99, error: e.message });
    }
});

//View all Sales
router.get('/admin/view/sale', Auth, async (req, res) => {

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

//Try to implement Logout feature and in this feature remove the last used authToken


module.exports = router;