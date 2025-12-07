const express = require('express');
const asyncMiddleware = require('../middlewares/async.middleware');
const verifyToken = require('../middlewares/verify-token-middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const labController = require('../controllers/lab.controller');

const router = express.Router();

router.route('/').post(labController.createLab);
router.route('/').get(labController.getLabAll);
router
  .route('/:id')
  .put(labController.editLab)
  .delete(labController.deleteLabById)
  .get(labController.getLabById);

router.route('/:id/students').get(labController.getStudentsByLabId);

router.route('/:id/student').post(labController.addStudentToLabById);

router.route('/:id/remove-student').delete(labController.removeStudentFromLab);

module.exports = router;
