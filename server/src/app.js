const express = require("express");
const morgan = require("morgan");
const { default: helmet } = require("helmet");
const compression = require("compression");
const cookieParser = require('cookie-parser');
const { default: mongoose } = require("mongoose");

const cors = require('cors');

const app = express();


// init middlewares
app.use(morgan("dev")); // hien thi mau sac cho status
app.use(helmet()); // ngan chan tan cong
app.use(compression()); // giam thieu dung luong payload
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(cors({origin: "http://localhost:5173"}));


// init database
require("./database/init.mongodb");



// require("./models/student-model.js");
// require("./models/user-model.js");
// require("./models/lab-model.js");
// require("./models/leave-request-model.js");
// require("./models/notification-model.js");






//init routes
const router = require("./routes/index")
router(app);



module.exports = app;