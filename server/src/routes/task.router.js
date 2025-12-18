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

router.patch(
  '/:id',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(taskController.updateTask)
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

// Student routes
router.get(
  '/student/my-tasks',
  asyncMiddleware(verifyToken),
  roleMiddleware('student'),
  asyncMiddleware(taskController.getMyTasks)
);

router.get(
  '/student/my-tasks/:id',
  asyncMiddleware(verifyToken),
  roleMiddleware('student'),
  asyncMiddleware(taskController.getMyTaskById)
);

router.patch(
  '/student/my-tasks/:id/progress',
  asyncMiddleware(verifyToken),
  roleMiddleware('student'),
  asyncMiddleware(taskController.updateMyTaskProgress)
);

module.exports = router;

