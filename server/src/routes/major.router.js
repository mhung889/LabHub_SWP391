const express = require("express");
const verifyToken = require('../middlewares/verify-token-middleware');
const asyncMiddleware = require('../middlewares/async.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const majorController = require("../controllers/major.controller");

const router = express.Router();

// Public route - get all majors (for dropdowns, etc.)
router.get("/", asyncMiddleware(majorController.getAllMajors));

// Search majors (public)
router.get("/search", asyncMiddleware(majorController.searchMajors));

// Admin routes - require authentication and admin role
router.get(
  "/:id",
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(majorController.getMajorById)
);

router.post(
  "/",
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(majorController.createMajor)
);

router.patch(
  "/:id",
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(majorController.updateMajor)
);

router.delete(
  "/:id",
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(majorController.deleteMajor)
);

module.exports = router;
