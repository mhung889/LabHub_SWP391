const express = require('express');
const asyncMiddleware = require('../middlewares/async.middleware');
const verifyToken = require('../middlewares/verify-token-middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const leaveRequestController = require('../controllers/leave-request.controller');

const router = express.Router();

router.use(asyncMiddleware(verifyToken));

router
  .route('/')
  .post(
    roleMiddleware('student'),
    asyncMiddleware(leaveRequestController.createLeaveRequest)
  )
  .get(roleMiddleware('mentor'), leaveRequestController.getAllLeaveRequests);

router
  .route('/mine')
  .get(
    roleMiddleware('student'),
    asyncMiddleware(leaveRequestController.getMyLeaveRequests)
  );

router
  .route('/:id/cancel')
  .patch(
    roleMiddleware('student'),
    asyncMiddleware(leaveRequestController.cancelLeaveRequest)
  );

router
  .route('/:id')
  .get(
    roleMiddleware(['mentor', 'student']),
    leaveRequestController.getLeaveRequestById
  );

router
  .route('/:id/approve')
  .patch(roleMiddleware('mentor'), leaveRequestController.approveLeaveRequest);

router
  .route('/:id/reject')
  .patch(roleMiddleware('mentor'), leaveRequestController.rejectLeaveRequest);

module.exports = router;
