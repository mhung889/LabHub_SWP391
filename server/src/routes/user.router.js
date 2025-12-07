const express = require('express');
const multer = require('multer');
const asyncMiddleware = require('../middlewares/async.middleware');
const verifyUserToken = require('../middlewares/verify-user-token');
const { upload, uploadToCloudinary } = require('../middlewares/upload.middleware');

const router = express.Router();

const {
    login,
    refreshToken,
    getProfile,
    updateProfile,
    uploadAvatar,
} = require('../controllers/user.controller');

// Middleware để xử lý lỗi multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                statusCode: 400,
                message: 'Kích thước file không được vượt quá 5MB'
            });
        }
        return res.status(400).json({
            statusCode: 400,
            message: err.message || 'Lỗi upload file'
        });
    }
    if (err) {
        return res.status(400).json({
            statusCode: 400,
            message: err.message || 'Lỗi upload file'
        });
    }
    next();
};

router.route('/login').post(asyncMiddleware(login));
router.route('/refresh-token').post(asyncMiddleware(refreshToken));
router.route('/profile')
    .get(asyncMiddleware(verifyUserToken), asyncMiddleware(getProfile))
    .put(asyncMiddleware(verifyUserToken), asyncMiddleware(updateProfile));
router.route('/profile/avatar')
    .post(
        asyncMiddleware(verifyUserToken),
        upload.single('avatar'),
        handleUploadError,
        uploadToCloudinary,
        asyncMiddleware(uploadAvatar)
    );

module.exports = router;

