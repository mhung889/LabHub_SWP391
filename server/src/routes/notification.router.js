const express = require('express');
const router = express.Router();
const verify = require('../middlewares/verify-token-middleware');
const notifCtrl = require('../controllers/notification.controller');

// Student endpoints
router.get('/student', verify, notifCtrl.listForStudent);
router.put('/:id/read', verify, notifCtrl.markAsRead);

// Mentor endpoints (require mentor role)
router.post('/', verify, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') return res.status(403).json({ success:false, message: 'Không có quyền'});
    await notifCtrl.create(req, res);
  } catch (err) { next(err); }
});

router.get('/', verify, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') return res.status(403).json({ success:false, message: 'Không có quyền'});
    await notifCtrl.list(req, res);
  } catch (err) { next(err); }
});

router.put('/:id', verify, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') return res.status(403).json({ success:false, message: 'Không có quyền'});
    await notifCtrl.update(req, res);
  } catch (err) { next(err); }
});

router.delete('/:id', verify, async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') return res.status(403).json({ success:false, message: 'Không có quyền'});
    await notifCtrl.remove(req, res);
  } catch (err) { next(err); }
});

module.exports = router;
