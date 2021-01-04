var express = require('express');
require('./db/mongoose');
var cors = require('cors');  
var customerRouter = require('./router/customerRouter');
var adminRouter = require('./router/adminRouter');

var app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(adminRouter);
app.use(customerRouter);

app.listen(port,() => {
    console.log("Server is up and running:"+port);
})
