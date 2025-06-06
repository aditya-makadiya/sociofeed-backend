import multer from 'multer';
import { AppError } from './errorHandler.js';

/**
 * Multer configuration for avatar uploads to Cloudinary.
 */
const uploadAvatar = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new AppError(
          'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
          400
        )
      );
    }
    cb(null, true);
  },
}).single('avatar'); // Expect a single file with field name 'avatar'

/**
 * Multer configuration for post image uploads to Cloudinary.
 */
const uploadPostImages = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 4, // Maximum 4 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new AppError(
          'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
          400
        )
      );
    }
    cb(null, true);
  },
}).array('images', 4); // Expect multiple files with field name 'images', max 4

export { uploadAvatar, uploadPostImages };
