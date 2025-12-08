const express = require('express');
const asyncMiddleware = require('../middlewares/async.middleware');
const verifyToken = require('../middlewares/verify-token-middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const labController = require('../controllers/lab.controller');

const router = express.Router();


// router.route('/simple')
//   .get(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.getLabs));

// router.route('/')
//   .get(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.getLabAll))
//   .post(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.createLab));
// router
//   .route('/:id')
//   .get(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.getLabById))
//   .put(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.editLab))
//   .delete(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.deleteLabById));

// router.route('/:id/students')
//   .get(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.getStudentsByLabId));

// router.route('/:id/student')
//   .post(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.addStudentToLabById));

// router.route('/:id/remove-student')
//   .delete(asyncMiddleware(verifyToken), roleMiddleware('admin'), asyncMiddleware(labController.removeStudentFromLab));




router.route('/').post(labController.createLab).get(labController.getLabAll);
router.route('/simple').get(labController.getLabs);
router
  .route('/:id')
  .put(labController.editLab)
  .delete(labController.deleteLabById)
  .get(labController.getLabById);

router.route('/:id/students').get(labController.getStudentsByLabId);

router.route('/:id/student').post(labController.addStudentToLabById);

router.route('/:id/remove-student').delete(labController.removeStudentFromLab);


module.exports = router;
