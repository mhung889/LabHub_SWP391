const express = require('express');
const verifyToken = require('../middlewares/verify-token-middleware');
const asyncMiddleware = require('../middlewares/async.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

const {
  login,
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  getAccountById,
  refreshToken,
  exportExcelFileAccounts,
} = require('../controllers/account.controller');

router
  .route('/')
  .post(createAccount)
  .get(
    asyncMiddleware(verifyToken),
    roleMiddleware('admin'),
    asyncMiddleware(getAccounts),
  );

router.route('/export-excel').get(asyncMiddleware(exportExcelFileAccounts));

router.route('/login').post(asyncMiddleware(login));

router.route('/refresh-token').post(asyncMiddleware(refreshToken));

router
  .route('/:id')
  .patch(asyncMiddleware(verifyToken), asyncMiddleware(updateAccount))
  .delete(deleteAccount)
  .get(getAccountById);

module.exports = router;
