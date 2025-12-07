const express = require('express');
const verifyToken = require('../middlewares/verify-token-middleware');
const asyncMiddleware = require('../middlewares/async.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const {
  login,
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  getAccountById,
  refreshToken,
  changePassword,
} = require('../controllers/account.controller');

const router = express.Router();


router
  .route('/')
  .post(createAccount)
  .get(
    asyncMiddleware(verifyToken),
    roleMiddleware('admin'),
    asyncMiddleware(getAccounts),
  );

// export-excel route removed (not implemented)

router.route('/login').post(asyncMiddleware(login));

router.route('/refresh-token').post(asyncMiddleware(refreshToken));

router
  .route('/:id')
  .patch(
    asyncMiddleware(verifyToken), 
    upload.single('image'),
    asyncMiddleware(updateAccount)
  )
  .delete(deleteAccount)
  .get(getAccountById);

// Change password route
router.route('/:id/change-password').patch(
  asyncMiddleware(verifyToken),
  asyncMiddleware(changePassword)
);

module.exports = router;
