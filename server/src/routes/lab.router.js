const express = require('express');
const asyncMiddleware = require('../middlewares/async.middleware');
const verifyToken = require('../middlewares/verify-token-middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const { getLabs, createLab } = require("../controllers/lab.controller");

const router = express.Router();

// Get all labs
router.get(
  '/',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(getLabs)
);

// Create lab
router.post(
  '/',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(createLab)
);

module.exports = router;
