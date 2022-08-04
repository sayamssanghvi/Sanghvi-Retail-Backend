var express = require('express');
require('./db/mongoose');
var cors = require('cors');  
var customerRouter = require('./router/customerRouter')
var adminRouter = require('./router/adminRouter');
let repairRouter = require('./router/repairRouter');
let { oneTimeExecutionScriptsForDB }= require('./scripts/oneTimeExecutionScriptsForDB');
var app = express();

const port = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(adminRouter);
app.use(customerRouter);
app.use(repairRouter);

oneTimeExecutionScriptsForDB.then(() => {
    app.listen(port, () => {
        console.log("Server is up and running:" + port);
    });
})
