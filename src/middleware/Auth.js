const jwt = require('jsonwebtoken');
const { Admin } = require('../models/Admin');

var Auth = async (req, res, next) => {

    try {
        var token = req.header('Authorization').replace('Bearer ', '');
        var decoder = jwt.verify(token, '85391SMC');
        var admin = await Admin.findOne({ _id: decoder._id, 'tokens.token': token });
        if (!admin)
            throw new Error('Admin does not exist');
        req.admin = admin;
        next();
    } catch (e) {
        console.log("Auth Error " + e.message);
        res.status(401).send("Invalid Authorization");
    }

}

module.exports = Auth;