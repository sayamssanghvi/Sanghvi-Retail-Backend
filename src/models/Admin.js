const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment/moment');

var Schema = mongoose.Schema({
    phonenumber: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value) {
            if (value.length != 10)
                throw new Error("PhoneNumber length should be 10");
            if (value.slice(0, 1) == '0')
                throw new Error("PhoneNumber cannot start with 0");
        }
    },
    password: {
        type: String,
        required: true,
    },
    tokens: [{
        token: {
            type: String
        },
        created_at: {
            type: String
        }
    }],
    role: {
        type: String
    },
    language: {
        type: String
    }
}, {
    timestamps: true
});

//#region Custom variables for fetching details where admin has entered data 
Schema.virtual('adminSale', {
    ref: 'Sale',
    localField: 'phonenumber',
    foreignField: 'admin'
});

Schema.virtual('repairSale', {
    ref: 'RepairSale',
    localField: 'phonenumber',
    foreignField: 'admin'
});

Schema.virtual('adminCustomer', {
    ref: 'Customer',
    localField: 'phonenumber',
    foreignField: 'admin'
});
//#endregion

Schema.methods.generateAuthToken = async function () {
    let admin = this;
    let token = await jwt.sign({ _id: admin._id.toString() }, process.env.ADMIN_REG_KEY, {
        expiresIn: "1d"
    });
    admin.tokens = admin.tokens.concat({ token, created_at: moment().utcOffset("+05:30").toString() });
    await admin.save();
    console.log(admin);
    return { token, role: admin.role, language: admin.language };
};

Schema.statics.findByCredentials = async function (phonenumber, password) {
    let admin = await Admin.findOne({ phonenumber });
    if (!admin)
        throw new Error("This phonenumber does not exists");
    let code = await bcrypt.compare(password, admin.password);
    if (!code)
        throw new Error("Invalid password");
    return admin;
};

Schema.pre('save', async function (next) {
    let user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

let Admin = new mongoose.model('Admin', Schema);

module.exports = {
    Admin
}