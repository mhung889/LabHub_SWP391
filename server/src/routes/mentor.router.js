const express = require('express');
const verifyToken = require('../middlewares/verify-token-middleware');
const asyncMiddleware = require('../middlewares/async.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const {
  getMentors,
  getMentorById,
  createMentor,
  updateMentor,
  searchMentors,
  getMentorAttendance,
  updateCheckInTime,
  updateCheckOutTime,
} = require('../controllers/mentor.controller');

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Mentor router is working!' });
});

router.get('/search', asyncMiddleware(searchMentors));

router.get(
  '/attendance',
  asyncMiddleware(verifyToken),
  roleMiddleware('mentor'),
  asyncMiddleware(getMentorAttendance)
);

router.patch(
  '/attendance/:id/checkin-time',
  verifyToken,
  roleMiddleware('mentor'),
  asyncMiddleware(updateCheckInTime)
);

router.patch(
  '/attendance/:id/checkout-time',
  verifyToken,
  roleMiddleware('mentor'),
  asyncMiddleware(updateCheckOutTime)
);

router.get('/', asyncMiddleware(getMentors));

router.get('/:id', asyncMiddleware(getMentorById));

router.post('/', upload.single('image'), asyncMiddleware(createMentor));

router.patch('/:id', upload.single('image'), asyncMiddleware(updateMentor));

// router.get(
//   '/search',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   asyncMiddleware(searchMentors)
// );

// router.get(
//   '/',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   asyncMiddleware(getMentors)
// );

// router.get(
//   '/:id',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   asyncMiddleware(getMentorById)
// );

// router.post(
//   '/',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   upload.single('image'),
//   asyncMiddleware(createMentor)
// );

// router.patch(
//   '/:id',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   upload.single('image'),
//   asyncMiddleware(updateMentor)
// );

module.exports = router;
