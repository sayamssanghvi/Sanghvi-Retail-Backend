const express = require('express');
require('./db/mongoose');
const cors = require('cors');
const customerRouter = require('./router/customerRouter')
const adminRouter = require('./router/adminRouter');
let repairRouter = require('./router/repairRouter');
let { oneTimeExecutionScriptsForDB } = require('./scripts/oneTimeExecutionScriptsForDB');
const app = express();

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

