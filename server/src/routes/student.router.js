const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const verifyToken = require('../middlewares/verify-token-middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.get(
  '/history', 
  verifyToken, 
  roleMiddleware('student'), 
  studentController.getAttendanceHistory
);
// MENTOR
router.get(
  '/my',
  verifyToken,
  roleMiddleware('mentor'),
  studentController.getMyStudents
);

// ========================
// CRUD
// ========================
router.get('/', studentController.getAllStudents);

router.get('/:id', studentController.getStudentById);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);


module.exports = router;
