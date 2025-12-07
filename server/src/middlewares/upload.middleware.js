const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Kiểm tra cấu hình Cloudinary
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_SECRET) {
  console.warn('⚠️  Cloudinary chưa được cấu hình đầy đủ trong .env');
}

// Sử dụng memory storage
const storage = multer.memoryStorage();

// Tạo multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Kiểm tra file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
  },
});

// Middleware để upload lên Cloudinary sau khi multer xử lý
const uploadToCloudinary = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Sử dụng upload_stream với buffer
  const uploadOptions = {
    folder: 'Human Management/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ],
    public_id: `avatar_${Date.now()}_${Math.round(Math.random() * 1E9)}`,
  };

  // Upload buffer trực tiếp
  cloudinary.uploader.upload_stream(
    uploadOptions,
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return next(new Error('Lỗi khi upload ảnh lên Cloudinary: ' + error.message));
      }
      
      if (!result) {
        return next(new Error('Không nhận được kết quả từ Cloudinary'));
      }
      
      // Lưu URL vào req.file
      req.file.url = result.secure_url || result.url;
      req.file.public_id = result.public_id;
      console.log('Upload successful, URL:', req.file.url);
      next();
    }
  ).end(req.file.buffer);
};

module.exports = { upload, uploadToCloudinary };

