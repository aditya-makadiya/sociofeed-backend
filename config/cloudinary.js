import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
import { AppError } from '../middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const configureCloudinary = () => {
  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_PRESET,
  } = process.env;

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET ||
    !CLOUDINARY_UPLOAD_PRESET
  ) {
    throw new AppError(
      'Missing or incomplete Cloudinary configuration in environment variables',
      500
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
};

// Initialize Cloudinary
export const cloudinaryInstance = configureCloudinary();

// Function to upload default avatar
const uploadDefaultAvatar = async () => {
  try {
    const filePath =
      'D:/Internship/sociofeed/sociofeed-backend/assets/default_avatar.jpg';

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError(
        'Default avatar file not found at specified path',
        400
      );
    }

    // Upload to Cloudinary
    const result = await cloudinaryInstance.uploader.upload(filePath, {
      folder: 'sociofeed/avatars',
      public_id: 'default_avatar',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      invalidate: true,
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    console.log(result);

    // console.log('Upload successful!');
    // console.log('Public ID:', result.public_id);
    // console.log('Secure URL:', result.secure_url);

    // Update your .env file manually with the secure URL
    // console.log('Add this to your .env file:');
    // console.log(`CLOUDINARY_DEFAULT_AVATAR_URL=${result.secure_url}`);
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw new AppError(
      `Failed to upload default avatar: ${error.message}`,
      500
    );
  }
};

// Execute the upload
uploadDefaultAvatar();
