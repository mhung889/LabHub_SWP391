const express = require('express');
const asyncMiddleware = require('../middlewares/async.middleware');
const verifyToken = require('../middlewares/verify-token-middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const {createLab} = require("../controllers/lab.controller")


const router = express.Router();


router.route("/")





module.exports = router
