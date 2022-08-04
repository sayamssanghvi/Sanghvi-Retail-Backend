const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_LOCAL_PATH, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify:false
});