const express = require('express');
const asyncMiddleware = require('../middlewares/async.middleware');
const verifyToken = require('../middlewares/verify-token-middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const labController = require('../controllers/lab.controller');

const router = express.Router();

router.route('/')
  .get(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.getLabAll))
  .post(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.createLab));
router
  .route('/:id')
  .get(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.getLabById))
  .put(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.editLab))
  .delete(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.deleteLabById));

router.route('/:id/students')
  .get(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.getStudentsByLabId));

router.route('/:id/student')
  .post(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.addStudentToLabById));

router.route('/:id/remove-student')
  .delete(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.removeStudentFromLab));

module.exports = router;
