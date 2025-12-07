const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("./database/init.mongodb");  // connect DB

const app = express();

// Middlewares
// app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173" }));

// Routes
const routes = require("./routes/index");
routes(app);

module.exports = app;
