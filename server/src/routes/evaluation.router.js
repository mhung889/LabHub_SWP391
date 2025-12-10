const express = require('express');
const verifyToken = require('../middlewares/verify-token-middleware');
const asyncMiddleware = require('../middlewares/async.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const evaluationController = require('../controllers/evaluation.controller');

const router = express.Router();

// UC-50: Configure Evaluation Criteria (OJT)
router.get(
  '/criterias',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(evaluationController.getEvaluationCriterias)
);

router.post(
  '/criterias',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(evaluationController.createEvaluationCriteria)
);

router.patch(
  '/criterias/:id',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(evaluationController.updateEvaluationCriteria)
);

router.delete(
  '/criterias/:id',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(evaluationController.deleteEvaluationCriteria)
);

// UC-51: Student Evaluation (Mentor)
router.get(
  '/criterias/active',
  asyncMiddleware(verifyToken),
  asyncMiddleware(evaluationController.getActiveCriterias)
);

router.get(
  '/students',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(evaluationController.getAssignedStudents)
);

router.post(
  '/',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(evaluationController.createOrUpdateEvaluation)
);

router.get(
  '/student/:studentId',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(evaluationController.getEvaluationByStudent)
);

router.get(
  '/mentor/list',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(evaluationController.getMentorEvaluations)
);

// UC-52: Submit Evaluation Report (Mentor)
router.post(
  '/:evaluationId/submit',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(evaluationController.submitEvaluation)
);

// UC-53: View Evaluation Result (Student)
router.get(
  '/student/result',
  asyncMiddleware(verifyToken),
  roleMiddleware('student'),
  asyncMiddleware(evaluationController.getStudentEvaluation)
);

// UC-54: Evaluation Report List (OJT)
router.get(
  '/reports',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(evaluationController.getEvaluationReports)
);

router.get(
  '/reports/:id',
  asyncMiddleware(verifyToken),
  roleMiddleware('admin'),
  asyncMiddleware(evaluationController.getEvaluationReportDetail)
);

module.exports = router;

