const express = require('express');
const verifyToken = require('../middlewares/verify-token-middleware');
const asyncMiddleware = require('../middlewares/async.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const taskController = require('../controllers/task.controller');

const router = express.Router();

router.get(
  '/',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(taskController.getTasks)
);

router.get(
  '/:id',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(taskController.getTaskById)
);

router.post(
  '/',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(taskController.createTask)
);

router.post(
  '/:id/assign',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(taskController.assignTask)
);

router.get(
  '/:id/students',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(taskController.getAssignedStudents)
);

router.delete(
  '/:id',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(taskController.deleteTask)
);

module.exports = router;

