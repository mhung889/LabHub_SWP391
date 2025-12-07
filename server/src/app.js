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
app.use(cors({origin: "http://localhost:5173"})); // CORS must come before helmet
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin requests
})); // ngan chan tan cong
app.use(compression()); // giam thieu dung luong payload
app.use(express.json({ limit: '50mb' })); // Tăng limit để xử lý ảnh base64
app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb', // Tăng limit cho urlencoded
  })
);
app.use(cookieParser());


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